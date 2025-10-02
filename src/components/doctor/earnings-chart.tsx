"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", earnings: 1860 },
  { month: "February", earnings: 3050 },
  { month: "March", earnings: 2370 },
  { month: "April", earnings: 730 },
  { month: "May", earnings: 2090 },
  { month: "June", earnings: 2140 },
]

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--accent))",
  },
}

export function EarningsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Earnings Overview</CardTitle>
        <CardDescription>January - June 2024 (Mock Data)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
             <YAxis
                tickFormatter={(value) => `$${value/1000}k`}
             />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="earnings" fill="var(--color-earnings)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
