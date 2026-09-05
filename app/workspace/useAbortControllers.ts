"use client";

import { useEffect, useRef } from "react";
import React from "react";

export type AbortControllerBundle = {
  uploadControllerRef: React.MutableRefObject<AbortController | null>;
  queryControllerRef: React.MutableRefObject<AbortController | null>;
  generateControllerRef: React.MutableRefObject<AbortController | null>;
  isMountedRef: React.MutableRefObject<boolean>;
  startController: (
    ref: React.MutableRefObject<AbortController | null>,
  ) => AbortController;
  isControllerActive: (controller: AbortController) => boolean;
};

// One AbortController per concern (upload / paged query / generation) plus a
// mounted flag. Aborts everything on unmount so no callback touches dead state.
export function useAbortControllers(): AbortControllerBundle {
  const uploadControllerRef = useRef<AbortController | null>(null);
  const queryControllerRef = useRef<AbortController | null>(null);
  const generateControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const uploadController = uploadControllerRef;
    const queryController = queryControllerRef;
    const generateController = generateControllerRef;
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      uploadController.current?.abort();
      queryController.current?.abort();
      generateController.current?.abort();
    };
  }, []);

  const startController = (
    ref: React.MutableRefObject<AbortController | null>,
  ) => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller;
  };

  const isControllerActive = (controller: AbortController) =>
    isMountedRef.current && !controller.signal.aborted;

  return {
    uploadControllerRef,
    queryControllerRef,
    generateControllerRef,
    isMountedRef,
    startController,
    isControllerActive,
  };
}
