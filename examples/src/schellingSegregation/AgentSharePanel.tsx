import { PlayControllerState } from './components/PlayControllerPanel';
import React, { useCallback, useMemo, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { PieChart } from '@mui/icons-material';
import SplitSlider from './components/SplitSlider';
import { calculateRGBValues } from './CalculateRGBValues';

type AgentSharePanelProps = {
  agentTypeCumulativeShares: number[];
  setAgentTypeCumulativeShares: (agentTypeCumulativeShares: number[]) => void;
  gridSize: number;
  update: (
    playControllerState: PlayControllerState,
    _gridSize?: number,
    _agentTypeCumulativeShares?: number[],
  ) => Promise<void>;
};
export const AgentSharePanel = (props: AgentSharePanelProps) => {
  const [agentTypeCumulativeShares, setAgentTypeCumulativeShares] = useState<
    number[]
  >(props.agentTypeCumulativeShares);

  const [rgbValues, setRGBValues] = useState<Array<[number, number, number]>>(
    calculateRGBValues(agentTypeCumulativeShares).rgbValues,
  );

  const valueLabelFormat = useCallback(
    (value: number, index: number) => {
      const format = (value: number) => `${(value * 100).toFixed(1)}%`;
      if (index === 0 || index === -1) {
        return format(value); // 最初のサムはそのままの値を表示
      }
      return format(value - agentTypeCumulativeShares[index - 1]); // 直前の値との差を表示
    },
    [agentTypeCumulativeShares],
  );

  const empty = useMemo(
    () =>
      (
        (1 - agentTypeCumulativeShares[agentTypeCumulativeShares.length - 1]) *
        100
      ).toFixed(1),
    [agentTypeCumulativeShares],
  );

  const onAgentTypeCumulativeSharesChange = useCallback(
    (values: number[]) => {
      const newAgentTypeCumulativeShares = values;
      setAgentTypeCumulativeShares(newAgentTypeCumulativeShares);
      const { rgbValues } = calculateRGBValues(newAgentTypeCumulativeShares);
      setRGBValues(rgbValues);
      props.update(
        PlayControllerState.INITIALIZING,
        props.gridSize,
        newAgentTypeCumulativeShares,
      );
    },
    [props.update, props.gridSize],
  );

  return (
    <Tooltip title={`AgentShares (${empty}% empty)`} placement={'right'}>
      <Box
        style={{
          display: 'flex',
          columnGap: '18px',
          alignItems: 'center',
        }}
      >
        <PieChart style={{ marginTop: '8px', marginRight: '8px' }} />
        <SplitSlider
          splitValues={agentTypeCumulativeShares}
          onChange={onAgentTypeCumulativeSharesChange}
          rgbValues={rgbValues}
          valueLabelFormat={valueLabelFormat}
        />
      </Box>
    </Tooltip>
  );
};
