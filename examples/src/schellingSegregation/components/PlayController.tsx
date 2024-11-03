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
  tick: () => Promise<boolean>;
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
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [fps, setFps] = useState<string | null>(null);

  const frame = useRef<number | null>(null);
  const numStepFrames = useRef<number>(0);
  const startedAt = useRef<number | null>(null);
  const pausedAt = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateFrameCount = (frameCount: number) => {
    frame.current = frameCount;
    if (startedAt.current && startedAt.current > 0) {
      const now = Date.now();
      setFps(
        (
          (frameCount - numStepFrames.current) /
          ((now - startedAt.current) / 1000)
        ).toFixed(1),
      );
      setElapsed(Math.round((now - startedAt.current) / 1000));
    }
    props.updateFrameCount(frameCount);
  };

  const onSpeedChange = useCallback(
    (_: Event, value: number[] | number) => {
      setSpeed(value as number);
    },
    [setSpeed],
  );

  const stepTimer = () => {
    numStepFrames.current++;
    props.tick().then((_: boolean) => {
      nextFrameCount();
    });
  };

  const stopTimer = useCallback(() => {
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = null;
    pausedAt.current = Date.now();
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (startedAt.current !== null && pausedAt.current !== null) {
      startedAt.current = Date.now() - (pausedAt.current - startedAt.current);
    } else {
      startedAt.current = Date.now();
      frame.current = 0;
    }
    const delay = Math.pow(1.0 - speed, 2) * 1000 + 1;
    let running = false;
    timerRef.current = setInterval(() => {
      if (!running) {
        running = true;
        props.tick().then((_: boolean) => {
          nextFrameCount();
          running = false;
        });
      }
    }, delay);
  };

  const restartTimer = () => {
    stopTimer();
    startTimer();
  };

  const resetFrameCount = () => {
    startedAt.current = null;
    numStepFrames.current = 0;
    setElapsed(null);
    setFps(null);
    updateFrameCount(0);
  };

  const nextFrameCount = () => {
    frame.current !== null && updateFrameCount(frame.current + 1);
  };

  useEffect(() => {
    switch (props.state) {
      case PlayControllerState.INITIALIZING:
      case PlayControllerState.INITIALIZED:
        stopTimer();
        resetFrameCount();
        break;
      case PlayControllerState.RUNNING:
        if (!timerRef.current) {
          startTimer();
        }
        break;
      case PlayControllerState.STEP_RUNNING:
        stepTimer();
        break;
      case PlayControllerState.PAUSED:
        stopTimer();
        break;
      default:
        break;
    }
  }, [props.state, props.tick]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (props.speed !== speed) {
      restartTimer();
    }
  }, [speed, startTimer]);

  const color =
    props.state === PlayControllerState.RUNNING ? 'warning' : 'primary';

  return (
    <>
      <StyledButtonGroup color={color}>
        <SubPlayButton
          variant="contained"
          size="small"
          onClick={props.onReset}
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
          onClick={props.onPause}
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
          onClick={props.onStep}
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
          onClick={props.onPlay}
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
          margin: '0 8px 8px',
          columnGap: '8px',
        }}
      >
        <Box
          style={{
            display: 'flex',
            width: '65%',
            columnGap: '12px',
            padding: '1px 8px 1px 8px',
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
            color={color}
            onChange={onSpeedChange}
          />
          🐇
        </Box>
        <Typography
          fontSize={11}
          color={color}
          style={{
            alignSelf: 'center',
            padding: '0 0 0 0',
            width: '35%',
          }}
        >
          {frame.current}

          {elapsed !== null ? '  / ' + elapsed + ' sec' : ''}

          {fps !== null ? ' (' + fps + ' fps)' : ''}
        </Typography>
      </Box>
    </>
  );
};
