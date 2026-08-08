# User Documentation

Welcome to DevineDesk!

## Getting Started

1. Navigate to `/auth/register` to create a new account.
2. Visit `/billing` to provision your initial credit balance via Stripe.
3. Once your account is funded, navigate to the **Studio** (`/studio`) to begin building your AI workflows.

## Using the Studio

The Studio is a node-based DAG (Directed Acyclic Graph) editor.

- **Drag & Drop**: Pull nodes from the left sidebar onto the canvas.
- **Connecting**: Drag wires from the output ports of one node to the input ports of another.
- **Execution**: Press "Run" at the top right to execute the flow. You will be billed fractions of a credit based on the compute cost of the nodes executed.

## Managing your Organization

If you are collaborating with a team:

1. Navigate to `/workspace`.
2. Click "Create Organization" to establish a shared environment.
3. Invite users via their email addresses. They will receive an invitation link they can accept to join your shared billing and workflow scope.
