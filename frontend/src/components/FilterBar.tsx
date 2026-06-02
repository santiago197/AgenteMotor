import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
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
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        p: 2.5,
        borderRadius: 3,
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Badge badgeContent={activeCount} color="primary" sx={{ mr: 1 }}>
        <FilterListIcon sx={{ color: 'text.secondary' }} />
      </Badge>

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
              sx={{ minWidth: 160 }}
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
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160 }}
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
            sx={{ minWidth: 160 }}
          />
        );
      })}

      {activeCount > 0 && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={onReset}
          sx={{ ml: 'auto' }}
        >
          Limpiar
        </Button>
      )}
    </Box>
  );
}
