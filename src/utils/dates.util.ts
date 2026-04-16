import moment from 'moment-timezone';
import { config } from '../config';

export const formatDateTime = () => {
  const { timeZone } = config;

  const date = moment().tz(timeZone);

  return {
    date: date.format('YYYY-MM-DD'),
    time: date.format('HH:mm:ss'),
  };
};
