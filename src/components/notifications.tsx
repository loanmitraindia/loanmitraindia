"use client";

import { Toaster } from "sonner";

export default function Notifications() {
  return <Toaster position="top-center" closeButton duration={6000} visibleToasts={1}
    toastOptions={{ className: "loan-toast" }} />;
}
