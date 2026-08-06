import { cn } from "@/lib/utils";

type ProgressBarProps = {
  /** 进度条的无障碍名称（同屏多条时按币种区分） */
  ariaLabel: string;
  className?: string;
  /** 可选标记位置（0-100），不传则不渲染标记；超出范围会被 clamp */
  markerPercent?: number;
  /** 填充比例（0-100+），超出 100 按 100 渲染 */
  percent: number;
};

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

// 以标记为中心用 mask 抠出 ±3px（共 6px）透明缺口：2px 标记线居中，两侧各留 2px 露出底色（无需关心表面色）
function buildCutMask(markerPercent: number): string {
  const gapStart = `calc(${markerPercent}% - 3px)`;
  const gapEnd = `calc(${markerPercent}% + 3px)`;
  return `linear-gradient(to right, black ${gapStart}, transparent ${gapStart}, transparent ${gapEnd}, black ${gapEnd})`;
}

export default function ProgressBar({ ariaLabel, className, markerPercent, percent }: ProgressBarProps) {
  const fillPercent = clampPercent(percent);
  const cutMask = markerPercent === undefined ? undefined : buildCutMask(clampPercent(markerPercent));

  return (
    <div
      aria-label={ariaLabel}
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
      {/* 标记线左边缘 clamp 在条内：月初 0% / 月末 100% 时贴边且不超出进度条 */}
      {markerPercent !== undefined && (
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-green-600"
          style={{ left: `clamp(0px, calc(${clampPercent(markerPercent)}% - 1px), calc(100% - 2px))` }}
        />
      )}
    </div>
  );
}
