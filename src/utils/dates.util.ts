import moment from 'moment-timezone';
import { config } from '../config';

export const formatDateTime = (date?: Date) => {
  const { timeZone } = config;

  const momentDate = moment(date).tz(timeZone);

  return {
    date: momentDate.format('DD/MM/YYYY'),
    time: momentDate.format('HH:mm:ss A'),
  };
};
