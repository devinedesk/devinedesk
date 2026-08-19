import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PromoBanner } from "@/components/PromoBanner";
import { Footer } from "@/components/Footer";

// Lazy-load pages so each route becomes a separate chunk (smaller initial bundle).
const LandingPage = lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const VideoPage = lazy(() => import("@/pages/VideoPage").then((m) => ({ default: m.VideoPage })));
const ImagePage = lazy(() => import("@/pages/ImagePage").then((m) => ({ default: m.ImagePage })));
const FaceSwapPage = lazy(() => import("@/pages/FaceSwapPage").then((m) => ({ default: m.FaceSwapPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const AvatarPage = lazy(() => import("@/pages/AvatarPage").then((m) => ({ default: m.AvatarPage })));
const TemplatesPage = lazy(() => import("@/pages/TemplatesPage").then((m) => ({ default: m.TemplatesPage })));
const GenerationPage = lazy(() => import("@/pages/GenerationPage").then((m) => ({ default: m.GenerationPage })));
const AdminTemplateCreatePage = lazy(() =>
  import("@/pages/AdminTemplateCreatePage").then((m) => ({ default: m.AdminTemplateCreatePage })),
);
const BillingPage = lazy(() => import("@/pages/BillingPage").then((m) => ({ default: m.BillingPage })));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const RefundPage = lazy(() => import("@/pages/RefundPage").then((m) => ({ default: m.RefundPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <PromoBanner />
        <Navbar />
        <main>
          <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/video" element={<VideoPage />} />
              <Route path="/image" element={<ImagePage />} />
              <Route path="/face-swap" element={<FaceSwapPage />} />
              <Route path="/user/templates" element={<TemplatesPage />} />
              <Route path="/generation/:id" element={<GenerationPage />} />
              <Route path="/user/avatar" element={<AvatarPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route
                path="/admin/template/create"
                element={<AdminTemplateCreatePage />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
