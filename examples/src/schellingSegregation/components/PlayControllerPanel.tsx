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
const SubPlayButton = styled(PlayButton)`
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedAt = useRef<number>(0);
  const timeTotal = useRef<number>(0);

  const onSpeedChange = useCallback(
    (_: Event, value: number[] | number) => {
      setSpeed(value as number);
    },
    [setSpeed],
  );

  const start = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    startedAt.current = Date.now();
    const delay = Math.pow(1.0 - speed, 2) * 1000 + 1;
    let running = false;
    intervalRef.current = setInterval(() => {
      if (!running) {
        running = true;

        requestAnimationFrame(() => {
          props.tick().then((result: boolean) => {
            if (result) {
              frameCountRef.current++;
              setFrameCount(frameCountRef.current);
              updateFPS();
            }
            running = false;
          });
        });
      }
    }, delay);
  };

  const pause = useCallback(() => {
    intervalRef.current && clearTimeout(intervalRef.current);
    intervalRef.current = null;
    if (startedAt.current > 0) {
      timeTotal.current += Date.now() - startedAt.current;
      startedAt.current = 0;
    }
  }, []);

  const restart = () => {
    pause();
    start();
  };

  const reset = () => {
    startedAt.current = 0;
    frameCountRef.current = 0;
    stepFrameCount.current = 0;
    timeTotal.current = 0;
    setFrameCount(0);
    setElapsed(null);
    setFps(null);
  };

  const doStep = () => {
    frameCountRef.current++;
    setFrameCount(frameCountRef.current);
    stepFrameCount.current++;
    props.onStep();
  };

  const step = () => {
    /*
    props.tick().then((result: boolean) => {
      result && updateFPS();
    });
     */
    props.tick();
  };

  const updateFPS = () => {
    if (startedAt.current && startedAt.current > 0) {
      const elapsedMsec = Date.now() - startedAt.current + timeTotal.current;
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
  };

  useEffect(() => {
    switch (props.state) {
      case PlayControllerState.INITIALIZING:
      case PlayControllerState.INITIALIZED:
        pause();
        reset();
        break;
      case PlayControllerState.RUNNING:
        if (!intervalRef.current) {
          start();
        }
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
      restart();
    }
  }, [speed, start]);

  const color =
    props.state === PlayControllerState.RUNNING ? 'warning' : 'primary';

  return (
    <>
      <StyledButtonGroup color={color}>
        <SubPlayButton
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
        </SubPlayButton>
        <SubPlayButton
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
        </SubPlayButton>
        <SubPlayButton
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
        </SubPlayButton>
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
