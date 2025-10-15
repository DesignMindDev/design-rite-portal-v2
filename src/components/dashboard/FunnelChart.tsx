'use client'

interface FunnelStage {
  name: string
  count: number
  rate?: number
}

interface FunnelChartProps {
  stages: FunnelStage[]
  title?: string
}

export default function FunnelChart({ stages, title }: FunnelChartProps) {
  const maxCount = Math.max(...stages.map(s => s.count))

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      <div className="space-y-2">
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100
          const dropoffPercent = index > 0
            ? Math.round(((stages[index - 1].count - stage.count) / stages[index - 1].count) * 100)
            : 0

          return (
            <div key={stage.name} className="space-y-1">
              {/* Stage Bar */}
              <div
                className="relative bg-blue-600 text-white rounded-lg overflow-hidden transition-all hover:bg-blue-700"
                style={{ width: `${widthPercent}%`, minWidth: '30%' }}
              >
                <div className="flex items-center justify-between p-4">
                  <span className="font-medium">{stage.name}</span>
                  <span className="font-bold">{stage.count.toLocaleString()}</span>
                </div>

                {/* Conversion Rate Badge */}
                {stage.rate !== undefined && (
                  <div className="absolute top-2 right-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded">
                    {stage.rate}%
                  </div>
                )}
              </div>

              {/* Drop-off indicator */}
              {index < stages.length - 1 && dropoffPercent > 0 && (
                <div className="text-xs text-red-600 ml-4">
                  ↓ {dropoffPercent}% drop-off
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
