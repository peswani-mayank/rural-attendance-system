"use client";

import type * as faceapiTypes from "@vladmandic/face-api";
import { OfflineStudent } from "./offlineDb";

export interface FaceMatchResult {
  box: {
    x: number; // percentage (0 - 100)
    y: number; // percentage (0 - 100)
    width: number; // percentage (0 - 100)
    height: number; // percentage (0 - 100)
  };
  matchedStudentId?: string;
  matchedStudentName?: string;
  rollNumber?: string;
  confidence: number;
  isUnknown: boolean;
}

export interface StudentAttendanceResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  photoUrl?: string;
  status: "present" | "absent";
  confidence: number;
  matchedBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

let faceapiInstance: typeof faceapiTypes | null = null;
let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Lazily and dynamically imports @vladmandic/face-api only in the browser.
 * This completely avoids Node.js SSR prerendering errors (e.g. this.util.TextEncoder).
 */
export async function getFaceApi(): Promise<typeof faceapiTypes | null> {
  if (typeof window === "undefined") {
    return null;
  }
  if (!faceapiInstance) {
    try {
      faceapiInstance = (await import("@vladmandic/face-api")) as typeof faceapiTypes;
    } catch (err) {
      console.error("[FaceAPI] Failed to dynamically import face-api:", err);
      return null;
    }
  }
  return faceapiInstance;
}

/**
 * Loads the face detection, facial landmarks, and face recognition models.
 * Cached in memory so subsequent calls return immediately.
 */
export async function loadFaceRecognitionModels(): Promise<void> {
  if (typeof window === "undefined") return;
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const faceapi = await getFaceApi();
    if (!faceapi) {
      console.warn("[FaceAPI] Dynamic import returned null, skipping model load.");
      return;
    }

    const MODEL_URL = "/models";
    console.log("[FaceAPI] Loading face recognition models from:", MODEL_URL);

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log("[FaceAPI] All face recognition models loaded successfully.");
  })();

  return loadPromise;
}

/**
 * Extracts a 128-dimensional face embedding from a student enrollment photo.
 * Ensures exactly one face is detected in the photograph.
 */
export async function extractStudentFaceEmbedding(
  imageOrCanvas: HTMLImageElement | HTMLCanvasElement
): Promise<{
  success: boolean;
  embedding?: number[];
  faceCount: number;
  error?: string;
}> {
  if (typeof window === "undefined") {
    return { success: false, faceCount: 0, error: "Only available in browser" };
  }

  await loadFaceRecognitionModels();
  const faceapi = await getFaceApi();
  if (!faceapi) {
    return {
      success: false,
      faceCount: 0,
      error: "Face recognition engine unavailable in current environment.",
    };
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
  });

  const detections = await faceapi
    .detectAllFaces(imageOrCanvas, options)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    return {
      success: false,
      faceCount: 0,
      error: "No face detected. Please ensure the student is well-lit and looking directly at the camera.",
    };
  }

  if (detections.length > 1) {
    return {
      success: false,
      faceCount: detections.length,
      error: `Multiple faces (${detections.length}) detected. Student enrollment photo must contain only one person.`,
    };
  }

  // Exactly 1 face detected: convert Float32Array to standard number array
  const embedding = Array.from(detections[0].descriptor);
  return {
    success: true,
    embedding,
    faceCount: 1,
  };
}

/**
 * Performs individual face recognition for classroom attendance.
 * Compares detected faces in the image against enrolled students belonging ONLY to the selected class.
 */
export async function matchClassroomFaces(
  imageOrCanvas: HTMLImageElement | HTMLCanvasElement,
  enrolledStudents: OfflineStudent[],
  confidenceThreshold = 0.55
): Promise<{
  matchedDetections: FaceMatchResult[];
  attendanceRoster: StudentAttendanceResult[];
  totalFacesDetected: number;
  unknownFacesCount: number;
}> {
  if (typeof window === "undefined") {
    return {
      matchedDetections: [],
      attendanceRoster: enrolledStudents.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        photoUrl: s.facePhotoUrl,
        status: "absent",
        confidence: 0,
      })),
      totalFacesDetected: 0,
      unknownFacesCount: 0,
    };
  }

  await loadFaceRecognitionModels();
  const faceapi = await getFaceApi();
  if (!faceapi) {
    return {
      matchedDetections: [],
      attendanceRoster: enrolledStudents.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        photoUrl: s.facePhotoUrl,
        status: "absent",
        confidence: 0,
      })),
      totalFacesDetected: 0,
      unknownFacesCount: 0,
    };
  }

  const width =
    imageOrCanvas instanceof HTMLImageElement
      ? imageOrCanvas.naturalWidth || imageOrCanvas.width
      : imageOrCanvas.width;
  const height =
    imageOrCanvas instanceof HTMLImageElement
      ? imageOrCanvas.naturalHeight || imageOrCanvas.height
      : imageOrCanvas.height;

  // 1. Detect all faces with landmarks and 128D descriptors
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.4,
  });

  const detections = await faceapi
    .detectAllFaces(imageOrCanvas, options)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const totalFacesDetected = detections.length;

  // 2. Filter enrolled students who have a valid face embedding
  const studentsWithEmbeddings = enrolledStudents.filter(
    (s) => s.faceEmbedding && s.faceEmbedding.length === 128
  );

  const studentMap = new Map<string, OfflineStudent>();
  enrolledStudents.forEach((s) => studentMap.set(s.id, s));

  // Build FaceMatcher if students with embeddings exist
  let faceMatcher: any = null;
  if (studentsWithEmbeddings.length > 0) {
    const labeledDescriptors = studentsWithEmbeddings.map((student) => {
      return new faceapi.LabeledFaceDescriptors(student.id, [
        new Float32Array(student.faceEmbedding!),
      ]);
    });
    // Euclidean distance threshold: distance < threshold means a valid match
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, confidenceThreshold);
  }

  const matchedDetections: FaceMatchResult[] = [];
  const assignedStudentIds = new Set<string>();
  const studentMatchDetails = new Map<
    string,
    { confidence: number; box: FaceMatchResult["box"] }
  >();

  let unknownFacesCount = 0;

  // 3. Process every detected face independently
  for (const detection of detections) {
    const box = detection.detection.box;
    const pctBox = {
      x: Math.max(0, Math.min(100, (box.x / width) * 100)),
      y: Math.max(0, Math.min(100, (box.y / height) * 100)),
      width: Math.max(2, Math.min(100, (box.width / width) * 100)),
      height: Math.max(2, Math.min(100, (box.height / height) * 100)),
    };

    if (faceMatcher) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

      const distance = bestMatch.distance;
      const confidence = Math.max(0, Math.min(1, parseFloat((1 - distance).toFixed(2))));

      if (bestMatch.label !== "unknown" && !assignedStudentIds.has(bestMatch.label)) {
        const student = studentMap.get(bestMatch.label);
        if (student) {
          assignedStudentIds.add(student.id);
          studentMatchDetails.set(student.id, { confidence, box: pctBox });

          matchedDetections.push({
            box: pctBox,
            matchedStudentId: student.id,
            matchedStudentName: student.name,
            rollNumber: student.rollNumber,
            confidence,
            isUnknown: false,
          });
          continue;
        }
      }
    }

    // Unmatched face or unknown person
    unknownFacesCount++;
    matchedDetections.push({
      box: pctBox,
      confidence: 0,
      isUnknown: true,
    });
  }

  // 4. Construct complete attendance roster for the selected class
  const attendanceRoster: StudentAttendanceResult[] = enrolledStudents.map((student) => {
    const match = studentMatchDetails.get(student.id);
    if (match) {
      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        photoUrl: student.facePhotoUrl,
        status: "present",
        confidence: match.confidence,
        matchedBox: match.box,
      };
    } else {
      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        photoUrl: student.facePhotoUrl,
        status: "absent",
        confidence: 0,
      };
    }
  });

  return {
    matchedDetections,
    attendanceRoster,
    totalFacesDetected,
    unknownFacesCount,
  };
}
