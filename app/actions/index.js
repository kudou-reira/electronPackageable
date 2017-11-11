import { ipcRenderer }  from 'electron';
import { ADD_VIDEO, ADD_VIDEOS, REMOVE_VIDEO, REMOVE_ALL_VIDEOS, VIDEO_PROGRESS, VIDEO_COMPLETE } from "./types";

// TODO: Communicate to MainWindow process that videos
// have been added and are pending conversion
export const addVideos = videos => dispatch => {
  ipcRenderer.send('videos:added', videos);
  ipcRenderer.on('metadata:complete',  (event, videosWithData) => {
    dispatch({
      type: ADD_VIDEOS,
      payload: videosWithData
    });
  });
};


// TODO: Communicate to MainWindow that the user wants
// to start converting videos.  Also listen for feedback
// from the MainWindow regarding the current state of
// conversion.
export const convertVideos = videos => dispatch => {
  ipcRenderer.send('conversion:start', videos);

  ipcRenderer.on('conversion:end', (event, convertedVideo) => {
    var video = convertedVideo.video;
    var outputPath = convertedVideo.outputPath;
    dispatch({
      type: VIDEO_COMPLETE,
      payload: {...video, outputPath}
    });
  })

  ipcRenderer.on('conversion:progress', (event, progressVideo) => {
    var video = progressVideo.video;
    var timemark = progressVideo.timemark;
    dispatch({
      type: VIDEO_PROGRESS,
      payload: { ...video, timemark }
    });
  });
};