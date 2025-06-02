import type { ExitType } from '../types.def';

const generic =
  'M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2';
const escalator =
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-2 6h-1.7l-5 9H7c-.83 0-1.5-.67-1.5-1.5S6.17 15 7 15h1.7l5-9H17c.83 0 1.5.67 1.5 1.5S17.83 9 17 9';
const lift =
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M8.5 6c.69 0 1.25.56 1.25 1.25S9.19 8.5 8.5 8.5s-1.25-.56-1.25-1.25S7.81 6 8.5 6m2.5 8h-1v4H7v-4H6v-2.5c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2zm4.5 3L13 13h5zM13 11l2.5-4 2.5 4z';
const stairs =
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-1 5h-2.42v3.33H13v3.33h-2.58V18H6v-2h2.42v-3.33H11V9.33h2.58V6H18z';

const PATHS: Record<ExitType, string> = {
  escalator,
  lift,
  elevator: lift,
  ramp: generic,
  stairs,
  steps: stairs,
  yes: generic,
  flat: generic,
};

export const Icon: React.FC<{ type: ExitType; colour?: string }> = ({
  type,
  colour,
}) => (
  <svg viewBox="0 0 24 24" className="icon">
    <path fill={colour} d={PATHS[type] || PATHS.yes} />
  </svg>
);

export const Arrow: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    viewBox="0 7 24 10"
    height={24}
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path fill="#999" d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z" />
  </svg>
);
