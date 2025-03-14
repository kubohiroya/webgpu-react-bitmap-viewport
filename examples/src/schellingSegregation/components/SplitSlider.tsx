import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Select,
  MenuItem,
  Slider,
  Box,
  SelectChangeEvent,
  FormControl,
} from '@mui/material';
import styled from '@emotion/styled';

type SplitSliderProps = {
  splitValues: number[];
  onChange: (values: number[]) => void;
  rgbValues: [number, number, number][];
  valueLabelFormat: (value: number, index: number) => ReactNode;
};

const StyledSelect = styled(Select)`
  margin: 2px;
  padding: 0 8px 0 0;
`;

const SplitSlider = (props: SplitSliderProps) => {
  const [splitCount, setSplitCount] = useState<number>(
    props.splitValues.length,
  ); // デフォルトの分割数を2に設定

  const [splitValues, setSplitValues] = useState<number[]>(props.splitValues); // デフォルトの分割位置

  const sx = useMemo(
    () => ({
      '& .MuiSlider-thumb': props.rgbValues
        .map((rgbValue, index) => {
          return [
            `&[data-index='${index}']`,
            {
              color: `rgb(${rgbValue.join(' ')})`,
            },
          ];
        })
        .reduce<Record<string, { color: string }>>(
          (acc: Record<string, { color: string }>, [key, value]: any) => {
            acc[key] = value;
            return acc;
          },
          {},
        ),
    }),
    [props.rgbValues],
  );

  // 分割数を変更したときの処理
  const handleSplitCountChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      const newCount = parseInt((event.target as any).value as string);
      setSplitCount(newCount);
      // 分割数に応じて初期値を設定（合計1.0を保つ）
      const newValues = Array(newCount)
        .fill(0)
        .map((value, index) => {
          return (index + 1.0) / (newCount + 1);
        });
      setSplitValues(newValues);
      props.onChange(newValues);
    },
    [props.onChange],
  );

  // スライダーの値を変更したときの処理
  const handleSliderChange = useCallback(
    (event: Event, value: number | number[]) => {
      const newValues = value as number[];
      setSplitValues(newValues);
      props.onChange(newValues);
    },
    [props.onChange],
  );

  // スライダーの値を表示するための関数
  const valuetext = useCallback((value: number) => value.toFixed(2), []);

  return (
    <Box
      style={{
        display: 'flex',
        columnGap: '16px',
        width: '100%',
        alignItems: 'center',
      }}
    >
      <FormControl size="small">
        <StyledSelect
          name={'splitCount'}
          value={splitCount}
          onChange={handleSplitCountChange}
          variant="outlined"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((count) => (
            <MenuItem key={count} value={count}>
              {count}
            </MenuItem>
          ))}
        </StyledSelect>
      </FormControl>
      <Slider
        value={splitValues}
        onChange={handleSliderChange}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        step={0.001}
        min={0}
        max={1}
        track={false}
        disableSwap
        sx={sx}
        valueLabelFormat={props.valueLabelFormat}
      />
    </Box>
  );
};

export default SplitSlider;
