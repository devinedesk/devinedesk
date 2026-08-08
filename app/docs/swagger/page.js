"use client";
import React, { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerDocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-8 text-neutral-400">Loading API Explorer...</div>;

  return (
    <div className="bg-white min-h-screen pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Interactive API Explorer</h1>
          <p className="text-neutral-500">
            Use this playground to test your live API keys against our OpenAPI specification.
          </p>
        </div>
        
        {/* Swagger UI automatically styles itself heavily, so we put it in a white container */}
        <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
          <SwaggerUI url="/api/openapi.json" />
        </div>
      </div>
    </div>
  );
}
