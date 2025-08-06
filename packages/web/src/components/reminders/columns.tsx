import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu"
import { MoreHorizontal, Check, X, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export type Reminder = {
  _id: string
  medicationId: {
    _id: string
    name: string
    dosage: string
    unit: string
  }
  scheduledTime: string
  status: "pending" | "taken" | "missed" | "skipped"
  takenAt?: string
  notes?: string
  doseTaken?: string
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: Clock,
  },
  taken: {
    label: "Taken",
    variant: "default" as const,
    icon: Check,
  },
  missed: {
    label: "Missed",
    variant: "destructive" as const,
    icon: X,
  },
  skipped: {
    label: "Skipped",
    variant: "secondary" as const,
    icon: AlertCircle,
  },
}

export const columns: ColumnDef<Reminder>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "scheduledTime",
    header: "Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("scheduledTime"))
      return (
        <div className="flex flex-col">
          <span className="font-medium">{format(date, "h:mm a")}</span>
          <span className="text-xs text-muted-foreground">
            {format(date, "MMM d, yyyy")}
          </span>
        </div>
      )
    },
  },
  {
    id: "medicationName",
    accessorFn: (row) => row.medicationId.name,
    header: "Medication",
    cell: ({ row }) => {
      const medication = row.original.medicationId
      return (
        <div className="flex flex-col">
          <span className="font-medium">{medication.name}</span>
          <span className="text-xs text-muted-foreground">
            {medication.dosage} {medication.unit}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig
      const config = statusConfig[status]
      const Icon = config.icon
      
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "takenAt",
    header: "Taken At",
    cell: ({ row }) => {
      const takenAt = row.getValue("takenAt") as string | undefined
      if (!takenAt) return <span className="text-muted-foreground">-</span>
      
      return format(new Date(takenAt), "h:mm a")
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string | undefined
      if (!notes) return <span className="text-muted-foreground">-</span>
      
      return (
        <span className="max-w-[200px] truncate" title={notes}>
          {notes}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const reminder = row.original
      const meta = table.options.meta as any
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {reminder.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => meta?.markAsTaken?.(reminder._id)}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as taken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.markAsSkipped?.(reminder._id)}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Skip
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => meta?.editReminder?.(reminder)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => meta?.deleteReminder?.(reminder._id)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]