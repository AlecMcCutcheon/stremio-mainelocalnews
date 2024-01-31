// Function to format the current time as a timestamp in Eastern Standard Time
const getTimestamp = () => {
    const currentDate = new Date();
    const estTimestamp = currentDate.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return estTimestamp;
  };
  
  // Sample function to simulate UpdateWMTWStreamUrl
  const UpdateWMTWStreamUrl = async () => {
    const timestamp = getTimestamp();
    console.log(`${timestamp} - Updating WMTW Stream URL...`);
    // Add your logic for updating the stream URL here
  };
  
  // Function to run the checkAndUpdate function with a dynamic interval
  const startDynamicInterval = () => {
    const dynamicLoop = async () => {
      const timestamp = getTimestamp();
      console.log(`${timestamp} - Dynamic interval loop`);
  
      await checkAndUpdate();
  
      // Calculate the time until the next 30-minute or hour mark
      const currentDate = new Date();
      const minutes = currentDate.getMinutes();
      const seconds = currentDate.getSeconds();
      const minutesUntilNextUpdate = (30 - (minutes % 30)) % 30 - 1; // Subtract 1 minute
      const secondsUntilNextUpdate = 60 - seconds;
      const remainingTime = minutesUntilNextUpdate * 60 * 1000 + secondsUntilNextUpdate * 1000;
  
      // Calculate the dynamic interval as 1/4 of the remaining time with a minimum of 5 seconds
      const dynamicInterval = Math.max(remainingTime / 4, 5000);
  
      // Calculate the scheduled time for the next dynamic interval in EST
      const estNextDynamicInterval = new Date(Date.now() + dynamicInterval).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true });
  
      // Log the scheduled time for the next dynamic interval
      console.log(`${timestamp} - Next dynamic interval is scheduled for ${estNextDynamicInterval}.`);
  
      // Set the interval for the next loop
      setTimeout(dynamicLoop, dynamicInterval);
    };
  
    // Start the initial loop
    dynamicLoop();
  };
  
  // Function to check if the current time is at an hour mark or half-hour mark
  const checkAndUpdate = async () => {
    const currentDate = new Date();
    const minutes = currentDate.getMinutes();
    
    if (minutes % 15 === 0) {
      await UpdateWMTWStreamUrl();
    }
  };
  
  // Start the dynamic interval loop
  startDynamicInterval();
  