"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsProps {
  file: File | null;
}

interface ColumnStats {
  name: string;
  type: string;
  uniqueValues: number;
  nullCount: number;
  frequency: { [key: string]: number };
}

export default function Analytics({ file }: AnalyticsProps) {
  const [stats, setStats] = useState<ColumnStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        
        // Initialize column statistics
        const columnStats: ColumnStats[] = headers.map(name => ({
          name,
          type: "unknown",
          uniqueValues: 0,
          nullCount: 0,
          frequency: {},
        }));

        // Process data
        lines.slice(1).forEach(line => {
          const values = line.split(",").map(v => v.trim());
          values.forEach((value, index) => {
            if (index < columnStats.length) {
              if (!value) {
                columnStats[index].nullCount++;
              } else {
                columnStats[index].frequency[value] = 
                  (columnStats[index].frequency[value] || 0) + 1;
              }
            }
          });
        });

        // Calculate unique values
        columnStats.forEach(stat => {
          stat.uniqueValues = Object.keys(stat.frequency).length;
          stat.type = inferType(Object.keys(stat.frequency)[0]);
        });

        setStats(columnStats);
        setLoading(false);
      };
      reader.readAsText(file);
    }
  }, [file]);

  if (!file) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Upload a CSV file to view analytics
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Analyzing data...</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{stat.name}</CardTitle>
            <CardDescription>
              Type: {stat.type} | Unique Values: {stat.uniqueValues} | Null Count:{" "}
              {stat.nullCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(stat.frequency)
                    .slice(0, 10)
                    .map(([name, value]) => ({ name, value }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function inferType(value: string): string {
  if (!value) return "unknown";
  if (!isNaN(Number(value))) return "number";
  if (!isNaN(Date.parse(value))) return "date";
  return "text";
}