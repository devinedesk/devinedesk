const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['app/api', 'src/lib'];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Regex to find JSON.parse(some.property) or JSON.parse(some.property || '[]')
      // This is a bit tricky, let's just make a safeParse function and inject it?
      // Actually, replacing `JSON.parse(` with a safe parse utility is easier.
      // But doing it via regex:
      // JSON\.parse\((.*?)\) -> (typeof ($1) === 'string' ? JSON.parse($1) : ($1))

      const originalContent = content;

      // Replaces JSON.parse( ... ) but avoids replacing already safe patterns
      // We use a simple regex but it might fail on nested parentheses.
      // Better to just define a global or local helper, or we can just replace specific known patterns.

      content = content.replace(
        /JSON\.parse\((w\.nodes\s*\|\|\s*'\[\]')\)/g,
        "(typeof w.nodes === 'string' ? JSON.parse(w.nodes || '[]') : (w.nodes || []))"
      );
      content = content.replace(
        /JSON\.parse\((w\.edges\s*\|\|\s*'\[\]')\)/g,
        "(typeof w.edges === 'string' ? JSON.parse(w.edges || '[]') : (w.edges || []))"
      );
      content = content.replace(
        /JSON\.parse\((w\.viewport)\)/g,
        "(typeof w.viewport === 'string' ? JSON.parse(w.viewport) : w.viewport)"
      );

      content = content.replace(
        /JSON\.parse\((wf\.nodes\s*\|\|\s*'\[\]')\)/g,
        "(typeof wf.nodes === 'string' ? JSON.parse(wf.nodes || '[]') : (wf.nodes || []))"
      );
      content = content.replace(
        /JSON\.parse\((wf\.edges\s*\|\|\s*'\[\]')\)/g,
        "(typeof wf.edges === 'string' ? JSON.parse(wf.edges || '[]') : (wf.edges || []))"
      );
      content = content.replace(
        /JSON\.parse\((wf\.viewport)\)/g,
        "(typeof wf.viewport === 'string' ? JSON.parse(wf.viewport) : wf.viewport)"
      );

      content = content.replace(
        /JSON\.parse\((newWf\.nodes\s*\|\|\s*'\[\]')\)/g,
        "(typeof newWf.nodes === 'string' ? JSON.parse(newWf.nodes || '[]') : (newWf.nodes || []))"
      );
      content = content.replace(
        /JSON\.parse\((newWf\.edges\s*\|\|\s*'\[\]')\)/g,
        "(typeof newWf.edges === 'string' ? JSON.parse(newWf.edges || '[]') : (newWf.edges || []))"
      );
      content = content.replace(
        /JSON\.parse\((newWf\.viewport)\)/g,
        "(typeof newWf.viewport === 'string' ? JSON.parse(newWf.viewport) : newWf.viewport)"
      );

      content = content.replace(
        /JSON\.parse\((updated\.nodes\s*\|\|\s*'\[\]')\)/g,
        "(typeof updated.nodes === 'string' ? JSON.parse(updated.nodes || '[]') : (updated.nodes || []))"
      );
      content = content.replace(
        /JSON\.parse\((updated\.edges\s*\|\|\s*'\[\]')\)/g,
        "(typeof updated.edges === 'string' ? JSON.parse(updated.edges || '[]') : (updated.edges || []))"
      );
      content = content.replace(
        /JSON\.parse\((updated\.viewport)\)/g,
        "(typeof updated.viewport === 'string' ? JSON.parse(updated.viewport) : updated.viewport)"
      );

      content = content.replace(
        /JSON\.parse\((workflow\.nodes)\)/g,
        "(typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes)"
      );
      content = content.replace(
        /JSON\.parse\((workflow\.edges)\)/g,
        "(typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges)"
      );

      content = content.replace(
        /JSON\.parse\((run\.outputs\s*\|\|\s*'\{\}')\)/g,
        "(typeof run.outputs === 'string' ? JSON.parse(run.outputs || '{}') : (run.outputs || {}))"
      );
      content = content.replace(
        /JSON\.parse\((run\.nodeOutputs\s*\|\|\s*'\{\}')\)/g,
        "(typeof run.nodeOutputs === 'string' ? JSON.parse(run.nodeOutputs || '{}') : (run.nodeOutputs || {}))"
      );

      content = content.replace(
        /JSON\.parse\((generation\.parameters\s*\|\|\s*'\{\}')\)/g,
        "(typeof generation.parameters === 'string' ? JSON.parse(generation.parameters || '{}') : (generation.parameters || {}))"
      );

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

DIRECTORIES.forEach((dir) => scanAndReplace(path.join(__dirname, dir)));
console.log('Done.');
