import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import type { FilterFieldConfig } from '../types';

interface FilterBarProps<T extends Record<string, unknown>> {
  fields: FilterFieldConfig[];
  values: T;
  onChange: (name: keyof T, value: unknown) => void;
  onReset: () => void;
  activeCount?: number;
}

export default function FilterBar<T extends Record<string, unknown>>({
  fields,
  values,
  onChange,
  onReset,
  activeCount = 0,
}: FilterBarProps<T>) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <TextField
              key={field.name}
              select
              label={field.label}
              value={(values[field.name] as string) ?? ''}
              onChange={(e) => onChange(field.name as keyof T as keyof T, e.target.value || undefined)}
              size="small"
              fullWidth
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {field.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        if (field.type === 'date') {
          return (
            <TextField
              key={field.name}
              type="date"
              label={field.label}
              value={(values[field.name] as string) ?? ''}
              onChange={(e) => onChange(field.name as keyof T, e.target.value || undefined)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          );
        }

        return (
          <TextField
            key={field.name}
            label={field.label}
            placeholder={field.placeholder}
            value={(values[field.name] as string) ?? ''}
            onChange={(e) => onChange(field.name, e.target.value || undefined)}
            size="small"
            fullWidth
          />
        );
      })}
    </Box>
  );
}
