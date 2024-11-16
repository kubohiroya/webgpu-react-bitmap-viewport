import { HueGridExample } from './multipleRandomImages/HueGridExample';
import { RGBARandomGridExample } from './multipleRandomImages/RGBARandomGridExample';
import { SynchronizedMultiStaticImage } from './multipleStaticImages/SynchronizedMultiStaticImage';
import Segregation from './schellingSegregation/Segregation';
import React, { useState } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab, Typography } from '@mui/material';
import { SegregationModes } from './schellingSegregation/SegregationUIProps';
import { WebGPUDeviceContextProvider } from 'webgpu-react-bitmap-viewport';

const WORKGROUP_SIZE_MAX = 64;

const SCHELLING_APPS_FULL = [
  [SegregationModes.JS, SegregationModes.ASM],
  [SegregationModes.GPU],
];
// const SCHELLING_APPS_HALF = [[SegregationModes.JS, SegregationModes.GPU]];
// const SCHELLING_APPS_GPU_ONLY = [[SegregationModes.GPU]];
const SCHELLING_APPS = SCHELLING_APPS_FULL;
// const SCHELLING_APPS = SCHELLING_APPS_HALF;
// const SCHELLING_APPS = SCHELLING_APPS_GPU_ONLY;

const urlParams = new URLSearchParams(window.location.search);
const seed = urlParams.get('seed') || undefined;
const gridSizeValue = urlParams.get('gridSize');
const gridSize = gridSizeValue ? parseInt(gridSizeValue) : 1024;

const SynchronizedHokusaiImage = () => {
  return (
    <>
      <h2>
        Synchronized Viewports of Static Image: "The Grate Wave off Kanagawa"
        from the series Thirty-six Views of Mount Fuji by Hokusai
      </h2>
      <SynchronizedMultiStaticImage
        src={'/webgpu-react-bitmap-viewport/The_Great_Wave_off_Kanagawa.jpg'}
        canvasSizes={[
          { width: 1044, height: 726 },
          { width: 547, height: 363 },
          { width: 220, height: 220 },
        ]}
        headerOffset={{ left: 20, top: 20 }}
      />
    </>
  );
};

const SynchronizedViewportsOfDynamicImage = () => {
  return (
    <>
      <div>
        <h2>Synchronized Viewports of Dynamic Image</h2>
        <h3>RGBARandomGrid</h3>
        <RGBARandomGridExample
          canvasSizes={[
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 },
          ]}
          headerOffset={{ left: 20, top: 20 }}
          numColumns={200}
          numRows={200}
          viewportStates={
            new Float32Array([
              0.0,
              0.0,
              200.0,
              200.0, // viewport index 0: left, top, right, bottom
              50.0,
              50.0,
              100.0,
              150.0, // viewport index 1: left, top, right, bottom
              0.0,
              100.0,
              100.0,
              150.0, // viewport index 2: left, top, right, bottom
            ])
          }
        />
      </div>
      <div>
        <h3>HueGrid</h3>
        <HueGridExample
          canvasSizes={[
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 },
          ]}
          headerOffset={{ left: 20, top: 20 }}
          numColumns={200}
          numRows={200}
          viewportStates={
            new Float32Array([
              0.0,
              0.0,
              200.0,
              200.0, // viewport index 0: left, top, right, bottom
              50.0,
              50.0,
              100.0,
              150.0, // viewport index 1: left, top, right, bottom
              0.0,
              100.0,
              100.0,
              150.0, // viewport index 2: left, top, right, bottom
            ])
          }
        />
      </div>
      ;
    </>
  );
};

const Schelling = ({ mode, index }: { mode: any; index: number }) => {
  return (
    <>
      <Typography>{mode}</Typography>
      <Segregation
        id={`schelling-${mode}-${index}`}
        mode={mode}
        seed={seed}
        gridSize={gridSize}
        workgroupSizeMax={WORKGROUP_SIZE_MAX}
        agentTypeShares={[0.15, 0.15, 0.15, 0.15, 0.15]}
        //agentTypeShares={[0.7, 0.23]}
        speed={1.0}
        tolerance={0.55}
        //tolerance={0.25}
        canvasSize={{ width: 512, height: 512 }}
        headerOffset={{ left: 0, top: 0 }}
        autoStart={false}
      />
    </>
  );
};

const DEFAULT_TAB_VALUE = document.location.hash || '#1';

export const App = () => {
  const [value, setValue] = useState<string>(DEFAULT_TAB_VALUE);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    document.location.hash = newValue;
  };

  return (
    <>
      <WebGPUDeviceContextProvider>
        <TabContext value={value}>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '20%' }}>
              <TabList
                onChange={handleChange}
                aria-label="webgpu-react-bitmap-viewport examples"
                orientation={'vertical'}
              >
                <Tab
                  label="Synchronized Viewports of Static Image"
                  value="#1"
                />
                <Tab
                  label="Synchronized Viewports of Dynamic Image"
                  value="#2"
                />
                <Tab label="Viewport of Multi Agent Simulation" value="#3" />
              </TabList>
            </Box>

            <TabPanel value="#1">
              <SynchronizedHokusaiImage />
            </TabPanel>

            <TabPanel value="#2">
              <SynchronizedViewportsOfDynamicImage />
            </TabPanel>

            <TabPanel value="#3">
              <h2>
                Viewport of Multi Agent Simulation: Schelling's model of
                segregation
              </h2>
              {SCHELLING_APPS.map(
                (modes: SegregationModes[], index: number) => (
                  <div
                    key={index}
                    style={{
                      background: '#ddd',
                      padding: '8px',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        columnGap: '16px',
                      }}
                    >
                      {modes.map((mode: SegregationModes, index: number) => (
                        <div
                          key={index}
                          style={{
                            background: '#eee',
                            padding: '8px',
                            borderRadius: '8px',
                          }}
                        >
                          <Schelling mode={mode} index={index}></Schelling>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </TabPanel>
          </Box>
        </TabContext>
      </WebGPUDeviceContextProvider>
    </>
  );
};

export default App;
