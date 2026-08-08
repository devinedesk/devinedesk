import React, { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { TbWorldWww } from 'react-icons/tb';
import { IoTrashOutline } from 'react-icons/io5';

const HttpNode = ({ id, data, selected }) => {
  const [formValues, setFormValues] = useState(
    data.formValues || { url: '', method: 'GET', headers: '{}', body: '' }
  );
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (data.onDataChange) {
      data.onDataChange(id, { formValues });
    }
  }, [formValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteNode = () => {
    if (window.confirm(`Are you sure you want to delete this HTTP node?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }
  };

  return (
    <div
      className={`
        flex flex-col w-80 rounded-2xl border-2 relative transition-all duration-300 ease-in-out
        ${selected ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02] ring-1 ring-purple-400/20' : 'border-zinc-800 hover:border-zinc-700 shadow-lg'}
        bg-[#0c0d0f]/95 backdrop-blur-sm
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-panel-bg to-card-bg rounded-t-2xl border-b border-zinc-800 py-2 px-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${selected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'} transition-colors`}
          >
            <TbWorldWww size={14} />
          </div>
          <h3 className="text-xs font-bold text-zinc-100">HTTP Request</h3>
        </div>
        <button
          onClick={handleDeleteNode}
          className="p-1 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
        >
          <IoTrashOutline size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3">
        <div className="flex gap-2">
          <select
            name="method"
            value={formValues.method}
            onChange={handleChange}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 w-1/3"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
          <input
            type="text"
            name="url"
            placeholder="https://api.example.com"
            value={formValues.url}
            onChange={handleChange}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 w-2/3 flex-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">
            Headers (JSON)
          </label>
          <textarea
            name="headers"
            value={formValues.headers}
            onChange={handleChange}
            placeholder="{}"
            rows={2}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 outline-none focus:border-purple-500 w-full resize-none font-mono"
          />
        </div>

        {formValues.method !== 'GET' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">Body</label>
            <textarea
              name="body"
              value={formValues.body}
              onChange={handleChange}
              placeholder="{{ node_id.output }}"
              rows={3}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 outline-none focus:border-purple-500 w-full resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="trigger"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-zinc-900 !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-zinc-900 !-right-1.5"
      />
    </div>
  );
};

export default HttpNode;
