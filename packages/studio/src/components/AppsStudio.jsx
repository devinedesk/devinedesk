"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaUserTie, FaImage, FaMagic, FaVideo, FaFileAlt, 
  FaBriefcase, FaHome, FaMicrophone, FaHandSparkles, FaBuilding,
  FaUserInjured, FaStethoscope, FaCar, FaPaw, FaBalanceScale, FaTruck, FaMapMarkerAlt,
  FaGithub, FaExternalLinkAlt, FaDollarSign, FaRocket, FaCreditCard 
} from "react-icons/fa";
import { registerAppInterest, getAppInterests } from '../apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '../../../../components/ui/Button.jsx';

const templateApps = [
  {
    name: "AI Headshot Studio",
    description: "Launch a headshot SaaS in minutes. Charge $5–$20 per set, keep all profits. Stripe payments & user accounts included.",
    icon: FaUserTie,
    color: "blue",
    repo: "https://github.com/SamurAIGPT/ai-headshot-generator",
    hosted: "https://ai-headshot-generator-xi.vercel.app/",
    thumbnail: "https://cdn.api.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png",
    isTemplate: true
  },
  {
    name: "Nano Banana Studio",
    description: "Your own AI image generation platform, ready to monetize. Add credit packs or subscriptions and start earning from day one.",
    icon: FaHandSparkles,
    color: "amber",
    repo: "https://github.com/SamurAIGPT/nano-banana-generator",
    hosted: "https://nano-banana-generator-psi.vercel.app",
    thumbnail: "https://cdn.api.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png",
    isTemplate: true
  },
  {
    name: "Seedance V2 Studio",
    description: "Deploy a premium AI art studio and sell access to users. Full Stripe integration lets you collect revenue immediately after launch.",
    icon: FaMagic,
    color: "purple",
    repo: "https://github.com/SamurAIGPT/seedance-2-generator",
    hosted: "https://seedance-2-generator.vercel.app/",
    thumbnail: "https://cdn.api.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png",
    isTemplate: true
  },
  {
    name: "AI Clipping Studio",
    description: "Launch your own AI-powered video clipping SaaS. Download YouTube videos and extract viral highlights with ease.",
    icon: FaVideo,
    color: "emerald",
    repo: "https://github.com/SamurAIGPT/ai-clipping-generator",
    hosted: "https://ai-clipping-generator.vercel.app/",
    thumbnail: "https://cdn.api.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png",
    isTemplate: true
  },
  {
    name: "EasyVeo Studio",
    description: "The complete Veo 3.1 video generation suite. Monetize text-to-video, image-to-video, and reference-to-video workflows with ease.",
    icon: FaVideo,
    color: "indigo",
    repo: "https://github.com/SamurAIGPT/veo4-video-generator",
    hosted: "https://veo4-video-generator.vercel.app/",
    thumbnail: "https://cdn.api.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png",
    isTemplate: true
  }
];

export default function AppsStudio({ apiKey }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestedApps, setRequestedApps] = useState([]);

  useEffect(() => {
    if (apiKey) {
      getAppInterests(apiKey)
        .then(setRequestedApps)
        .catch(err => console.error("Error fetching interests:", err));
    }
  }, [apiKey]);

  const handleRequestAccess = async () => {
    if (!selectedApp || !apiKey) return;
    
    setIsRequesting(true);
    try {
      await registerAppInterest(apiKey, selectedApp.name);
      setRequestedApps(prev => [...prev, selectedApp.name]);
      toast.success("Got it! We'll send you the template details shortly.");
      setTimeout(() => setSelectedApp(null), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to register interest. Please try again later.");
    } finally {
      setIsRequesting(false);
    }
  };

  const renderAppCard = (app, index = 0) => {
    // Premium Vibrant Gradients for placeholders
    const gradients = [
      "from-blue-600/20 to-indigo-600/20",
      "from-purple-600/20 to-pink-600/20",
      "from-amber-500/20 to-orange-600/20",
      "from-emerald-500/20 to-teal-600/20",
      "from-rose-500/20 to-red-600/20",
      "from-cyan-500/20 to-blue-600/20",
    ];
    const cardGradient = gradients[index % gradients.length];
    
    return (
      <div 
        key={app.name}
        className="group bg-panel-bg border border-white/5 rounded-lg flex flex-col overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-[#0f0f0f] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
      >
        {/* Thumbnail Section */}
        <div className="relative h-44 w-full overflow-hidden bg-white/5">
          {app.thumbnail ? (
            <img
              src={app.thumbnail}
              alt={app.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${cardGradient} transition-colors group-hover:scale-110 duration-700`}>
              <app.icon className={`text-4xl opacity-20 group-hover:opacity-40 transition-opacity text-white`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg text-primary border border-white/5 group-hover:border-white/10 transition-colors">
              <app.icon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate">{app.name}</h3>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{app.category || 'Template'}</p>
            </div>
          </div>
          
          <p className="text-xs text-white/50 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">{app.description}</p>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
                <a
                  href={app.repo || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  <FaGithub className="text-xs" />
                  Github
                </a>
                <a
                  href={app.hosted || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-primary/10 text-primary rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/20 transition-all border border-primary/20 active:scale-95"
                >
                  <FaExternalLinkAlt className="text-[9px]" />
                  Demo
                </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center bg-app-bg overflow-y-auto custom-scrollbar relative">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <div className="flex flex-col gap-10 items-center w-full max-w-7xl pt-12 pb-24 px-6">
        
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <FaDollarSign className="text-primary text-xs" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Revenue-Ready Templates</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9]">
            LAUNCH AN AI APP.<br />START EARNING TODAY.
          </h1>
          <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xl mx-auto">
            Each template is a fully-functional, Stripe-integrated AI SaaS you can deploy in minutes.
            Charge your users, keep the revenue — app handles the AI infrastructure.
          </p>
        </div>

        {/* Monetization Steps */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: FaRocket,
              step: "01",
              title: "Deploy in Minutes",
              body: "Fork the open-source template, add your app key, and push to Vercel. No backend setup needed."
            },
            {
              icon: FaCreditCard,
              step: "02",
              title: "Collect Payments",
              body: "Stripe is pre-wired. Set your own pricing — one-time credits, subscriptions, or pay-per-use."
            },
            {
              icon: FaDollarSign,
              step: "03",
              title: "Keep the Revenue",
              body: "Payments go straight to your Stripe account. You own the product, the brand, and the profits."
            }
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="flex items-start gap-4 bg-panel-bg border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                <Icon className="text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Step {step}</p>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-white/60 leading-relaxed font-medium">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pt-8">
          {templateApps.map((app, index) => renderAppCard(app, index))}
        </div>

        {/* Footer Accent */}
        <div className="pt-24 pb-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <span className="block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Local API Ecosystem — More templates coming soon</span>
          </div>
        </div>
      </div>

      {/* Get Template Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-panel-bg border border-white/10 w-full max-w-md rounded-2xl p-8 space-y-8 animate-scale-up shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl text-primary mb-2">
                <selectedApp.icon />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Deploy {selectedApp.name}
              </h2>
              <p className="text-sm font-medium text-white/60 leading-relaxed px-4">
                Enter your details and we&apos;ll send you the <b>{selectedApp.name}</b> template along with setup instructions so you can deploy and start earning immediately.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRequestAccess}
                disabled={isRequesting}
                variant="primary"
                fullWidth
                size="lg"
                className="font-black uppercase tracking-widest shadow-lg"
                isLoading={isRequesting}
              >
                {isRequesting ? 'Sending Details...' : 'Get Template'}
              </Button>
              <Button 
                onClick={() => setSelectedApp(null)}
                variant="ghost"
                fullWidth
                size="lg"
                className="font-bold uppercase tracking-widest border border-white/10"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
