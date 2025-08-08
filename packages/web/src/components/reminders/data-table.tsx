import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { Input } from "@medimate/components"
import { ChevronDown, Trash2, Check, MoreVertical, AlertCircle } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onMarkAsTaken?: (id: string) => void
  onMarkAsSkipped?: (id: string) => void
  onEditReminder?: (reminder: TData) => void
  onDeleteReminder?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  onBulkMarkAsTaken?: (ids: string[]) => void
  onBulkMarkAsSkipped?: (ids: string[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onMarkAsTaken,
  onMarkAsSkipped,
  onEditReminder,
  onDeleteReminder,
  onBulkDelete,
  onBulkMarkAsTaken,
  onBulkMarkAsSkipped,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      markAsTaken: onMarkAsTaken,
      markAsSkipped: onMarkAsSkipped,
      editReminder: onEditReminder,
      deleteReminder: onDeleteReminder,
    },
  })

  const handleBulkAction = async (action: 'delete' | 'markTaken' | 'markSkipped') => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) return
    
    const ids = selectedRows
      .map(row => (row.original as any)._id)
      .filter((id): id is string => !!id)
    
    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedRows.length} reminder(s)?`)) {
        if (onBulkDelete && ids.length > 0) {
          await onBulkDelete(ids)
        } else if (onDeleteReminder) {
          for (const id of ids) {
            await onDeleteReminder(id)
          }
        }
        setRowSelection({})
      }
    } else if (action === 'markTaken') {
      if (window.confirm(`Mark ${selectedRows.length} reminder(s) as taken?`)) {
        if (onBulkMarkAsTaken && ids.length > 0) {
          // Use bulk endpoint
          await onBulkMarkAsTaken(ids)
        } else if (onMarkAsTaken) {
          // Fallback to individual calls
          for (const id of ids) {
            await onMarkAsTaken(id)
          }
        }
        setRowSelection({})
      }
    } else if (action === 'markSkipped') {
      if (window.confirm(`Mark ${selectedRows.length} reminder(s) as skipped?`)) {
        if (onBulkMarkAsSkipped && ids.length > 0) {
          // Use bulk endpoint
          await onBulkMarkAsSkipped(ids)
        } else if (onMarkAsSkipped) {
          // Fallback to individual calls
          for (const id of ids) {
            await onMarkAsSkipped(id)
          }
        }
        setRowSelection({})
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter medications..."
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) =>
            table.setGlobalFilter(event.target.value)
          }
          className="max-w-sm"
        />
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4 mr-2" />
                Actions ({table.getFilteredSelectedRowModel().rows.length} selected)
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleBulkAction('markTaken')}
                className="cursor-pointer"
              >
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Mark as Taken
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('markSkipped')}
                className="cursor-pointer"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                Mark as Skipped
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value: any) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}