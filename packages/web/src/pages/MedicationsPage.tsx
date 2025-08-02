import React, { useState, useEffect } from "react"
import { Button, DataTable, ColumnDef } from "@medimate/components"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { api } from '../services/api'

// This type represents our medication data
export type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string
  remaining: number
  nextDose: string
}


export const columns: ColumnDef<Medication>[] = [
  {
    accessorKey: "name",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Medication
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "dosage",
    header: "Dosage",
    cell: ({ row }: { row: any }) => <div>{row.getValue("dosage")}</div>,
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }: { row: any }) => <div>{row.getValue("frequency")}</div>,
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }: { row: any }) => <div className="font-mono text-sm">{row.getValue("time")}</div>,
  },
  {
    accessorKey: "remaining",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remaining
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => {
      const remaining = row.getValue("remaining") as number
      return (
        <div className={`font-medium ${remaining <= 15 ? "text-red-600" : ""}`}>
          {remaining} pills
        </div>
      )
    },
  },
  {
    accessorKey: "nextDose",
    header: "Next Dose",
    cell: ({ row }: { row: any }) => <div className="text-muted-foreground">{row.getValue("nextDose")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }: { row: any }) => {
      const medication = row.original

      return (
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => console.log("Edit medication:", medication.id)}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    },
  },
]

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get<{
        status: string;
        results: number;
        data: {
          medications: Medication[];
        };
      }>('/medications')
      
      setMedications(response.data.medications)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch medications'
      setError(errorMessage)
      console.error('Error fetching medications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedication = () => {
    // TODO: Implement add medication functionality
    console.log("Add medication")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading medications...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchMedications}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Medications</h1>
          <p className="text-muted-foreground">
            Manage your medications and view upcoming doses
          </p>
        </div>
        <Button onClick={handleAddMedication}>
          Add Medication
        </Button>
      </div>
      
      {medications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No medications found</p>
          <Button onClick={handleAddMedication}>
            Add Your First Medication
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={medications} />
      )}
    </div>
  )
}