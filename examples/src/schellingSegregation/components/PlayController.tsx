import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  state: PlayControllerState;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  tick: () => Promise<void>;
  updateFrameCount(frameCount: number): void;
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
  const [speed, setSpeed] = useState<number>(props.speed);
  const [frameCount, setFrameCount] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateFrameCount = (frameCount: number) => {
    setFrameCount(frameCount);
    props.updateFrameCount(frameCount);
  };

  const onSpeedChange = useCallback(
    (_: Event, value: number[] | number) => {
      setSpeed(value as number);
    },
    [setSpeed],
  );

  const stopTimer = useCallback(() => {
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    const delay = Math.pow(1.0 - speed, 2) * 1000 + 1;
    timerRef.current = setTimeout(() => {
      props.tick().then(() => {
        updateFrameCount(frameCount + 1);
        startTimer();
      });
    }, delay);
  }, [speed, props.tick, frameCount]);

  const restartTimer = () => {
    stopTimer();
    startTimer();
  };

  useEffect(() => {
    switch (props.state) {
      case PlayControllerState.INITIALIZING:
      case PlayControllerState.INITIALIZED:
        stopTimer();
        updateFrameCount(0);
        break;
      case PlayControllerState.RUNNING:
        if (timerRef.current) {
          restartTimer();
        } else {
          startTimer();
        }
        break;
      case PlayControllerState.STEP_RUNNING:
        props.tick();
        updateFrameCount(frameCount + 1);
        break;
      case PlayControllerState.PAUSED:
        stopTimer();
        break;
      default:
        break;
    }
  }, [props.state, props.tick, frameCount]);

  useEffect(() => {
    if (props.speed !== speed) {
      restartTimer();
    }
  }, [speed]);

  return (
    <>
      <StyledButtonGroup>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onReset && props.onReset}
          disabled={
            props.state === PlayControllerState.INITIALIZING ||
            props.state === PlayControllerState.INITIALIZED ||
            props.state === PlayControllerState.RUNNING ||
            props.state === PlayControllerState.STEP_RUNNING
          }
        >
          <RestartAlt />
          Reset
        </SubPlayButton>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onPause && props.onPause}
          disabled={
            props.state === PlayControllerState.INITIALIZING ||
            props.state === PlayControllerState.INITIALIZED ||
            props.state === PlayControllerState.STEP_RUNNING ||
            props.state === PlayControllerState.PAUSED
          }
        >
          <Pause />
          Pause
        </SubPlayButton>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onStep && props.onStep}
          disabled={
            props.state === PlayControllerState.INITIALIZING ||
            props.state === PlayControllerState.RUNNING ||
            props.state === PlayControllerState.STEP_RUNNING
          }
        >
          <SkipNext />
          Step
        </SubPlayButton>
        <MainPlayButton
          variant="contained"
          onClick={props.onPlay && props.onPlay}
          disabled={
            props.state === PlayControllerState.INITIALIZING ||
            props.state === PlayControllerState.RUNNING ||
            props.state === PlayControllerState.STEP_RUNNING
          }
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
            value={speed}
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
          {frameCount}
        </Typography>
      </Box>
    </>
  );
};
