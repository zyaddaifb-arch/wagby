"use client";
import { useEffect } from "react";
import { registerWebMCPTools } from "@/utils/webmcp-tools";

export function WebMCPRegistrar() {
  useEffect(() => {
    registerWebMCPTools();
  }, []);
  
  return null;
}
