import React from "react";
import Link from "next/link";
import { FiArrowLeft, FiCpu, FiLayers, FiPlayCircle, FiSettings } from "react-icons/fi";

export const metadata = {
  title: "Studio Guides | DevineDesk Docs",
  description: "Learn how to use the DevineDesk visual DAG workflow builder.",
};

export default function StudioDocs() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="pt-24 pb-24 max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
          <FiArrowLeft /> Back to Documentation
        </Link>
        
        <div className="mb-12">
          <div className="h-12 w-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6">
            <FiCpu size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Studio Guides</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Master the DevineDesk visual workflow builder. Learn how to chain AI models together, handle data routing, parse JSON outputs, and execute massive batch jobs autonomously.
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiLayers className="text-cyan-400" /> 1. Understanding Nodes & Edges
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                The DevineDesk Studio operates as a Directed Acyclic Graph (DAG). Every action in your workflow is a <strong>Node</strong>, and data flows between them via <strong>Edges</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Input Nodes:</strong> Define the required parameters to trigger the workflow.</li>
                <li><strong className="text-white">Action Nodes:</strong> Execute an API call, an AI inference, or a data transformation.</li>
                <li><strong className="text-white">Output Nodes:</strong> Determine the final JSON response returned when the workflow completes.</li>
              </ul>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiSettings className="text-cyan-400" /> 2. Variable Parsing
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                To pass data dynamically between nodes, use the Handlebars-style syntax: <code>{`{{node_id.output_key}}`}</code>.
              </p>
              <p>
                For example, if you have a Text Generation node with the ID <code>text-gen-1</code>, you can pass its result into an Image Generation node by referencing <code>{`{{text-gen-1.text}}`}</code> in the image prompt field.
              </p>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiPlayCircle className="text-cyan-400" /> 3. Testing Your Workflow
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                Once your nodes are connected, click the <strong>Run</strong> button in the top right of the Studio. You can monitor the execution in real-time.
              </p>
              <p>
                If a node fails (e.g., due to an API error or invalid parameter), the execution will pause, and the node will highlight in red. You can inspect the error logs by clicking the failed node and reviewing the Debug Panel.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
