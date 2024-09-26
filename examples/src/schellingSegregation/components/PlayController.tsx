import React from 'react';
import { Box, Button, ButtonGroup, Slider, Typography } from '@mui/material';
import { Pause, PlayCircle, RestartAlt, SkipNext } from '@mui/icons-material';
import styled from '@emotion/styled';

export enum PlayControllerState {
  INITIALIZING,
  INITIALIZED,
  RUNNING,
  STEP_RUNNING,
  PAUSED,
}

export type PlayControllerProps = {
  isResettable: boolean;
  isPaused: boolean;
  isStepped: boolean;
  isPlayed: boolean;
  speed: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onSpeedChange: (value: number) => void;
  frameCount: number;
};
const StyledButtonGroup = styled(ButtonGroup)`
  margin: 4px;
  padding-left: 12px;
  padding-right: 12px;
  border-collapse: separate;
`;
const PlayButton = styled(Button)`
  border-radius: 30px;
  border-spacing: 1px;
  border-style: solid;
  border-color: lightgrey;
  border-width: 1px;
`;
const SubPlayButton = styled(PlayButton)`
  padding: 2px 8px 2px 4px;
`;
const MainPlayButton = styled(PlayButton)``;
export const PlayController = (props: PlayControllerProps) => {
  const onSpeedChange = (event: Event, value: number[] | number) => {
    props.onSpeedChange(value as number);
  };

  return (
    <>
      <StyledButtonGroup>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onReset && props.onReset}
          disabled={!props.isResettable}
        >
          <RestartAlt />
          Reset
        </SubPlayButton>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onPause && props.onPause}
          disabled={props.isPaused}
        >
          <Pause />
          Pause
        </SubPlayButton>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onStep && props.onStep}
          disabled={!props.isStepped}
        >
          <SkipNext />
          Step
        </SubPlayButton>
        <MainPlayButton
          variant="contained"
          onClick={props.onPlay && props.onPlay}
          disabled={props.isPlayed}
        >
          <PlayCircle />
          Play
        </MainPlayButton>
      </StyledButtonGroup>

      <Box
        style={{
          display: 'flex',
          margin: '0 36px 0 36px',
          columnGap: '18px',
        }}
      >
        <Box
          style={{
            display: 'flex',
            width: '90%',
            columnGap: '12px',
            padding: '1px 12px 1px 12px',
            borderRadius: '30px',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#b3b3b3',
          }}
        >
          🐢
          <Slider
            defaultValue={props.speed}
            aria-label="custom thumb label"
            valueLabelDisplay="auto"
            step={0.01}
            min={0}
            max={1}
            onChange={onSpeedChange}
          />
          🐇
        </Box>
        <Typography
          fontSize={11}
          color="grey"
          style={{
            alignSelf: 'center',
            padding: '0 10px 0 10px',
            width: '10%',
          }}
        >
          {props.frameCount}
        </Typography>
      </Box>
    </>
  );
};
