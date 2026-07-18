import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Stroke-style action icons on a 24pt grid, matching the tab icon language.
 * Color is passed in so they stay theme-agnostic.
 */

export interface ActionIconProps {
  color: string;
  size?: number;
}

const STROKE_WIDTH = 2;

export const PlusIcon = React.memo(function PlusIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M5 12h14" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

export const ClipboardIcon = React.memo(function ClipboardIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v14A1.5 1.5 0 0 0 6.5 22h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 5H16"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 2h5A1.5 1.5 0 0 1 16 3.5v1A1.5 1.5 0 0 1 14.5 6h-5A1.5 1.5 0 0 1 8 4.5v-1A1.5 1.5 0 0 1 9.5 2Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path d="M9 11.5h6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M9 15.5h6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

export const SearchIcon = React.memo(function SearchIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path d="m20.5 20.5-4.5-4.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

export const CheckIcon = React.memo(function CheckIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m5 12.5 4.5 4.5L19 7"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const CloseIcon = React.memo(function CloseIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 6 12 12" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M18 6 6 18" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

export const ChevronDownIcon = React.memo(function ChevronDownIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m6 9 6 6 6-6"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const ChevronLeftIcon = React.memo(function ChevronLeftIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m15 6-6 6 6 6"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const ChevronUpIcon = React.memo(function ChevronUpIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m6 15 6-6 6 6"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

/** Trash can — discard/delete affordance. */
export const TrashIcon = React.memo(function TrashIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7h14" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 7 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path d="M10 11v5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M14 11v5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

/** "i" inside a circle — opens an item's details. */
export const InfoIcon = React.memo(function InfoIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path d="M12 11.5v4.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={1.1} fill={color} />
    </Svg>
  );
});

/** Trending-up arrow inside a circle — opens an exercise's detail/insights. */
export const TrendingUpCircleIcon = React.memo(function TrendingUpCircleIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path
        d="m8 13.5 2.5-2.5 2 2L16 9.5"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.5 9.5H16V12"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const DotsHorizontalIcon = React.memo(function DotsHorizontalIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={19} cy={12} r={1.8} fill={color} />
    </Svg>
  );
});

export const DotsVerticalIcon = React.memo(function DotsVerticalIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={5} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={19} r={1.8} fill={color} />
    </Svg>
  );
});

/** Up/down arrows — reorder affordance. */
export const ReorderIcon = React.memo(function ReorderIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4v16m0 0-3-3m3 3 3-3"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 20V4m0 0-3 3m3-3 3 3"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

/** Two opposed arrows — swap/replace affordance. */
export const ReplaceIcon = React.memo(function ReplaceIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5h13m0 0-3.5-3.5M17 8.5 13.5 12"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 15.5H7m0 0 3.5 3.5M7 15.5 10.5 12"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

/** Three stacked lines — drag handle for reorderable rows. */
export const DragHandleIcon = React.memo(function DragHandleIconBase({
  color,
  size = 20,
}: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h16" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M4 12h16" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M4 16h16" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

/** Two stacked cards — duplicate/copy affordance. */
export const CopyIcon = React.memo(function CopyIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9h9a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 18 20.5H9A1.5 1.5 0 0 1 7.5 19V10.5A1.5 1.5 0 0 1 9 9Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path
        d="M4.5 15V5A1.5 1.5 0 0 1 6 3.5h9"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

/** Pencil — edit affordance. */
export const PencilIcon = React.memo(function PencilIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5V20"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m14 8 2.5 2.5"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const NoteIcon = React.memo(function NoteIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2.5H7A1.5 1.5 0 0 0 5.5 4v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V7L14 2.5Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <Path d="M14 2.5V7h4.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <Path d="M9 12.5h6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M9 16.5h6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

export const MinusIcon = React.memo(function MinusIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
});

/** Stopwatch — rest-timer affordance. */
export const TimerIcon = React.memo(function TimerIconBase({ color, size = 20 }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={13.5} r={7.5} stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path d="M9.5 2.5h5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M12 2.5V6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path
        d="M12 13.5V9.5"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});
