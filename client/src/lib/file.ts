const pickVideoQualityFromList = quality => list =>
  list.find(video => video.quality === String(quality));

export { pickVideoQualityFromList };
