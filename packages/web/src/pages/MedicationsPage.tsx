import React, { useState, useEffect } from "react"
import { DataTable, ColumnDef } from "@medimate/components"
import { Button } from "../components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { AddMedicationDialog } from '../components/AddMedicationDialog'

// This type represents our medication data
export type Medication = {
  id: string
  _id?: string // MongoDB ID
  name: string
  dosage: string
  unit: string
  frequency: string
  time?: string // Computed field for display
  times: string[]
  remaining?: number // Computed field based on quantity
  nextDose?: string // Computed field
  quantity?: number
  startDate: string
  prescribedBy?: string
  instructions?: string
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
    cell: ({ row }: { row: any }) => {
      const dosage = row.getValue("dosage")
      const unit = row.original.unit
      return <div>{dosage} {unit}</div>
    },
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }: { row: any }) => {
      const frequency = row.getValue("frequency") as string
      const frequencyDisplay: Record<string, string> = {
        once_daily: "Once Daily",
        twice_daily: "Twice Daily",
        three_times_daily: "3x Daily",
        four_times_daily: "4x Daily",
        as_needed: "As Needed",
        weekly: "Weekly",
        monthly: "Monthly",
      }
      return <div>{frequencyDisplay[frequency] || frequency}</div>
    },
  },
  {
    accessorKey: "times",
    header: "Times",
    cell: ({ row }: { row: any }) => {
      const times = row.getValue("times") as string[]
      return <div className="font-mono text-sm">{times.join(", ")}</div>
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => {
      const quantity = row.getValue("quantity") as number | undefined
      if (!quantity) return <div className="text-muted-foreground">—</div>
      return (
        <div className={`font-medium ${quantity <= 15 ? "text-red-600" : ""}`}>
          {quantity} pills
        </div>
      )
    },
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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchMedications()
    
    // Check if we're on /medications/add route
    if (location.pathname === '/medications/add') {
      setShowAddDialog(true)
    }
  }, [location.pathname])

  const fetchMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/medications')
      
      // Handle the response structure from the API
      const medicationsData = response.data?.medications || response.data || []
      setMedications(medicationsData)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch medications'
      setError(errorMessage)
      console.error('Error fetching medications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedication = () => {
    navigate('/medications/add')
    setShowAddDialog(true)
  }

  const handleAddSuccess = () => {
    fetchMedications() // Refresh the list
    navigate('/medications') // Remove /add from URL
  }
  
  const handleDialogChange = (open: boolean) => {
    setShowAddDialog(open)
    // Update URL based on dialog state
    if (!open && location.pathname === '/medications/add') {
      navigate('/medications')
    }
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
      
      <AddMedicationDialog
        open={showAddDialog}
        onOpenChange={handleDialogChange}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}