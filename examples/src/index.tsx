import { HueGridExample } from './multipleRandomImages/HueGridExample';
import { RGBARandomGridExample } from './multipleRandomImages/RGBARandomGridExample';
import { SynchronizedMultiStaticImage } from './multipleStaticImages/SynchronizedMultiStaticImage';
import SchellingSegregation from './schellingSegregation/SchellingSegregation';
import React from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab, Typography } from '@mui/material';
import { SchellingSegregationModes } from './schellingSegregation/SchellingSegregationShellProps';
import { WebGPUDeviceContextProvider } from 'webgpu-react-bitmap-viewport';

export const Index = () => {
  const [value, setValue] = React.useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
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
                <Tab label="Synchronized Viewports of Static Image" value="1" />
                <Tab
                  label="Synchronized Viewports of Dynamic Image"
                  value="2"
                />
                <Tab label="Viewport of Multi Agent Simulation" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <h2>
                Synchronized Viewports of Static Image: "The Grate Wave off
                Kanagawa" from the series Thirty-six Views of Mount Fuji by
                Hokusai
              </h2>
              <SynchronizedMultiStaticImage
                src={
                  '/webgpu-react-bitmap-viewport/The_Great_Wave_off_Kanagawa.jpg'
                }
                canvasSizes={[
                  { width: 1044, height: 726 },
                  { width: 547, height: 363 },
                  { width: 220, height: 220 },
                ]}
                headerOffset={{ left: 20, top: 20 }}
              />
            </TabPanel>

            <TabPanel value="2">
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
            </TabPanel>

            <TabPanel value="3">
              <h2>
                Viewport of Multi Agent Simulation: Schelling's model of
                segregation
              </h2>
              <div style={{ display: 'flex', columnGap: '16px' }}>
                {[
                  SchellingSegregationModes.CPU,
                  SchellingSegregationModes.GPU,
                ].map((mode: SchellingSegregationModes, index: number) => (
                  <div key={index}>
                    <Typography>{mode}</Typography>
                    <SchellingSegregation
                      id={`schelling-${mode}-${index}`}
                      mode={mode}
                      gridSize={256}
                      agentTypeShares={[0.5, 0.3, 0.1]}
                      speed={1.0}
                      tolerance={0.5}
                      canvasSize={{ width: 512, height: 512 }}
                      headerOffset={{ left: 0, top: 0 }}
                      autoStart={true}
                    />
                  </div>
                ))}
              </div>
            </TabPanel>
          </Box>
        </TabContext>
      </WebGPUDeviceContextProvider>
    </>
  );
};
