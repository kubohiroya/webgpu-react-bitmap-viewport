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
};
const StyledButtonGroup = styled(ButtonGroup)`
  margin: 4px;
  padding-left: 4px;
  padding-right: 4px;
  border-collapse: separate;
`;
const PlayButton = styled(Button)`
  border-radius: 30px;
  border-spacing: 1px;
  border-style: solid;
  border-color: lightgrey;
  border-width: 1px;
`;
const PaddedPlayButton = styled(PlayButton)`
  padding: 2px 8px 2px 4px;
`;
const MainPlayButton = styled(PlayButton)``;

export const PlayControllerPanel = (props: PlayControllerProps) => {
  const [speed, setSpeed] = useState<number>(props.speed);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [fps, setFps] = useState<string | null>(null);

  const stepFrameCount = useRef<number>(0);

  const frameCountRef = useRef<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);

  const handleRef = useRef<number | null>(null);
  const sessionStartedAt = useRef<number>(0);
  const timeTotal = useRef<number>(0);

  const requestStop = useRef<boolean>(false);

  const onSpeedChange = useCallback((_: Event, value: number[] | number) => {
    setSpeed(value as number);
  }, []);

  const start = useCallback(() => {
    handleRef.current !== null && cancelAnimationFrame(handleRef.current);
    handleRef.current = null;
    requestStop.current = false;

    sessionStartedAt.current = Date.now();
    const delay = Math.pow(1.0 - speed, 2) * 1000 + 1;
    let loopStartedAt = Date.now();

    const loop = async () => {
      const delta = Date.now() - loopStartedAt;
      if (delta >= delay) {
        const result = await props.tick();
        loopStartedAt = Date.now();
        if (result) {
          frameCountRef.current++;
          setFrameCount(frameCountRef.current);
          updateFPS();
          handleRef.current = requestAnimationFrame(loop);
        } else {
          handleRef.current !== null && cancelAnimationFrame(handleRef.current);
          handleRef.current = null;
          requestStop.current = true;
          return;
        }
      } else {
        !requestStop.current &&
          (handleRef.current = requestAnimationFrame(loop));
      }
    };
    handleRef.current = requestAnimationFrame(loop);
  }, [speed, props.tick]);

  const pause = useCallback(() => {
    handleRef.current !== null && cancelAnimationFrame(handleRef.current);
    handleRef.current = null;
    requestStop.current = true;
    if (sessionStartedAt.current > 0) {
      timeTotal.current += Date.now() - sessionStartedAt.current;
      sessionStartedAt.current = 0;
    }
  }, []);

  const reset = useCallback(() => {
    sessionStartedAt.current = 0;
    frameCountRef.current = 0;
    stepFrameCount.current = 0;
    timeTotal.current = 0;
    setFrameCount(0);
    setElapsed(null);
    setFps(null);
  }, []);

  const doStep = useCallback(() => {
    frameCountRef.current++;
    setFrameCount(frameCountRef.current);
    stepFrameCount.current++;
    props.onStep();
  }, [frameCountRef.current, stepFrameCount.current, props.onStep]);

  const step = useCallback(() => {
    props.tick();
  }, [props.tick]);

  const updateFPS = useCallback(() => {
    if (sessionStartedAt.current && sessionStartedAt.current > 0) {
      const elapsedMsec =
        Date.now() - sessionStartedAt.current + timeTotal.current;
      if (frameCountRef.current >= 10) {
        setFps(
          (
            (frameCountRef.current - stepFrameCount.current) /
            (elapsedMsec / 1000)
          ).toFixed(1),
        );
      }
      setElapsed(Math.round(elapsedMsec / 1000));
    }
  }, []);

  useEffect(() => {
    switch (props.state) {
      case PlayControllerState.INITIALIZING:
      case PlayControllerState.INITIALIZED:
        pause();
        reset();
        break;
      case PlayControllerState.RUNNING:
        start();
        break;
      case PlayControllerState.STEP_RUNNING:
        step();
        break;
      case PlayControllerState.PAUSED:
        pause();
        break;
      default:
        break;
    }
  }, [props.state, props.tick]);

  useEffect(() => {
    return () => {
      pause();
    };
  }, []);

  useEffect(() => {
    if (props.speed !== speed) {
      pause();
      start();
    }
  }, [speed, start]);

  const color =
    props.state === PlayControllerState.RUNNING ? 'warning' : 'primary';

  return (
    <>
      <StyledButtonGroup color={color}>
        <PaddedPlayButton
          title="Restart"
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
        </PaddedPlayButton>
        <PaddedPlayButton
          title="Pause"
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
        </PaddedPlayButton>
        <PaddedPlayButton
          title="Step"
          variant="contained"
          size="small"
          onClick={doStep}
          disabled={
            props.state === PlayControllerState.INITIALIZING ||
            props.state === PlayControllerState.RUNNING ||
            props.state === PlayControllerState.STEP_RUNNING
          }
        >
          <SkipNext />
          Step
        </PaddedPlayButton>
        <MainPlayButton
          title="Play"
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
          margin: '8px 8px 8px',
          columnGap: '8px',
          justifySelf: 'center',
          width: '100%',
        }}
      >
        <Box
          style={{
            display: 'flex',
            columnGap: '18px',
            padding: '3px 8px 3px 8px',
            borderRadius: '30px',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#b3b3b3',
            width: '100%',
          }}
        >
          <Typography style={{ alignSelf: 'center' }}>🐢</Typography>
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
          <Typography style={{ alignSelf: 'center' }}>🐇</Typography>
        </Box>
        <Box
          style={{
            display: 'flex',
            columnGap: '12px',
            padding: '2px 8px 2px 8px',
            borderRadius: '30px',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#b3b3b3',
            width: '45%',
          }}
        >
          <Typography
            fontSize={11}
            color={color}
            style={{
              width: '100%',
              alignSelf: 'center',
              textAlign: 'end',
              justifyContent: 'center',
            }}
          >
            {frameCount}
            {elapsed !== null ? '  / ' + elapsed + ' sec' : ''}
            {fps !== null ? ' (' + fps + ' fps)' : ''}
          </Typography>
        </Box>
      </Box>
    </>
  );
};
