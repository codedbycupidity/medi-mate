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
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { Input } from "@medimate/components"
import { ChevronDown, Trash2 } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onMarkAsTaken?: (id: string) => void
  onMarkAsSkipped?: (id: string) => void
  onEditReminder?: (reminder: TData) => void
  onDeleteReminder?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onMarkAsTaken,
  onMarkAsSkipped,
  onEditReminder,
  onDeleteReminder,
  onBulkDelete,
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

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    console.log('Selected rows:', selectedRows.length)
    if (selectedRows.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} reminder(s)?`)) {
      // Collect all IDs for bulk deletion
      const ids = selectedRows
        .map(row => {
          const reminder = row.original as any
          console.log('Row data:', reminder)
          return reminder._id
        })
        .filter((id): id is string => !!id)
      
      console.log('IDs to delete:', ids)
      
      if (onBulkDelete && ids.length > 0) {
        // Use bulk delete if available
        console.log('Using bulk delete')
        await onBulkDelete(ids)
      } else if (onDeleteReminder) {
        // Fallback to individual deletion
        console.log('Using individual deletion')
        for (const id of ids) {
          await onDeleteReminder(id)
        }
      }
      // Clear selection after deletion
      setRowSelection({})
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
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {table.getFilteredSelectedRowModel().rows.length} selected
          </Button>
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