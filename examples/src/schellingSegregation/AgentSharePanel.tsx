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
  const [rgbValues, setRGBValues] = useState<Array<[number, number, number]>>(
    calculateRGBValues(props.agentTypeCumulativeShares).rgbValues,
  );

  const valueLabelFormat = useCallback(
    (value: number, index: number) => {
      const format = (value: number) => `${(value * 100).toFixed(1)}%`;
      if (index === 0 || index === -1) {
        return format(value);
      }
      return format(value - props.agentTypeCumulativeShares[index - 1]); // 直前の値との差を表示
    },
    [props.agentTypeCumulativeShares],
  );

  const empty = useMemo(
    () =>
      (
        (1 -
          props.agentTypeCumulativeShares[
            props.agentTypeCumulativeShares.length - 1
          ]) *
        100
      ).toFixed(1),
    [props.agentTypeCumulativeShares],
  );

  const onAgentTypeCumulativeSharesChange = useCallback(
    (values: number[]) => {
      const newAgentTypeCumulativeShares = values;
      props.setAgentTypeCumulativeShares(newAgentTypeCumulativeShares);
      const { rgbValues } = calculateRGBValues(newAgentTypeCumulativeShares);
      setRGBValues(rgbValues);
      props.update(
        PlayControllerState.INITIALIZING,
        props.gridSize,
        newAgentTypeCumulativeShares,
      );
    },
    [props.update, props.gridSize, props.agentTypeCumulativeShares],
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
          splitValues={props.agentTypeCumulativeShares}
          onChange={onAgentTypeCumulativeSharesChange}
          rgbValues={rgbValues}
          valueLabelFormat={valueLabelFormat}
        />
      </Box>
    </Tooltip>
  );
};
