import { cn } from "@/lib/utils";

type ProgressBarProps = {
  className?: string;
  /** 可选标记位置（0-100），不传则不渲染标记；超出范围会被 clamp */
  markerPercent?: number;
  /** 填充比例（0-100+），超出 100 按 100 渲染 */
  percent: number;
};

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

// 标记两侧各 2px 用 mask 把轨道+填充抠出透明缺口，直接露出下方底色（无需关心表面色）
function buildCutMask(markerPercent: number): string {
  const gapStart = `calc(${markerPercent}% - 3px)`;
  const gapEnd = `calc(${markerPercent}% + 3px)`;
  return `linear-gradient(to right, black ${gapStart}, transparent ${gapStart}, transparent ${gapEnd}, black ${gapEnd})`;
}

export default function ProgressBar({ className, markerPercent, percent }: ProgressBarProps) {
  const fillPercent = clampPercent(percent);
  const cutMask = markerPercent === undefined ? undefined : buildCutMask(clampPercent(markerPercent));

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(fillPercent)}
      className={cn("relative h-2 w-full", className)}
      role="progressbar"
    >
      <div
        className="absolute inset-0 rounded-full bg-muted"
        style={cutMask === undefined ? undefined : { WebkitMaskImage: cutMask, maskImage: cutMask }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
      {markerPercent !== undefined && (
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-green-600"
          style={{ left: `${clampPercent(markerPercent)}%` }}
        />
      )}
    </div>
  );
}
