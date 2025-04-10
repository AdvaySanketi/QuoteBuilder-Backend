const uptime = (uptimeInSeconds: number) => {
  const pluralize = (count: number, singular: string, plural: string) =>
    count === 1 ? singular : plural;

  let uptimeMessage;

  if (uptimeInSeconds < 60) {
    const seconds = Math.floor(uptimeInSeconds);
    uptimeMessage = `${seconds} ${pluralize(seconds, "second", "seconds")}`;
  } else if (uptimeInSeconds < 3600) {
    const minutes = Math.floor(uptimeInSeconds / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    uptimeMessage = `${minutes} ${pluralize(
      minutes,
      "minute",
      "minutes"
    )}, ${seconds} ${pluralize(seconds, "second", "seconds")}`;
  } else if (uptimeInSeconds < 86400) {
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    uptimeMessage = `${hours} ${pluralize(
      hours,
      "hour",
      "hours"
    )}, ${minutes} ${pluralize(minutes, "minute", "minutes")}`;
  } else {
    const days = Math.floor(uptimeInSeconds / 86400);
    const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    uptimeMessage = `${days} ${pluralize(
      days,
      "day",
      "days"
    )}, ${hours} ${pluralize(hours, "hour", "hours")}, ${minutes} ${pluralize(
      minutes,
      "minute",
      "minutes"
    )}, ${seconds} ${pluralize(seconds, "second", "seconds")}`;
  }

  return uptimeMessage;
};

module.exports = uptime;
