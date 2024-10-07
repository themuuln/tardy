'use client';

import { differenceInSeconds, format } from 'date-fns';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Employee = {
  name: string;
  position: string;
  imageUrl: string;
};

type StoredData = {
  clockInTime: string | null;
  clockOutTime: string | null;
  totalWorkedToday: number;
  weeklyHours: number[];
  hourlyRate: number;
};

const STORAGE_KEY = 'timeTrackerData';

const loadStoredData = (): StoredData => {
  if (typeof window === 'undefined') return getInitialData();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return getInitialData();

  const data = JSON.parse(stored);
  return {
    ...data,
    clockInTime: data.clockInTime
      ? new Date(data.clockInTime).toISOString()
      : null,
    clockOutTime: data.clockOutTime
      ? new Date(data.clockOutTime).toISOString()
      : null,
  };
};

const getInitialData = (): StoredData => ({
  clockInTime: null,
  clockOutTime: null,
  totalWorkedToday: 0,
  weeklyHours: [0, 0, 0, 0, 0],
  hourlyRate: 15,
});

const saveToStorage = (data: StoredData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export default function Component() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [totalWorkedToday, setTotalWorkedToday] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0]);
  const [hourlyRate, setHourlyRate] = useState(15);
  const [employee] = useState<Employee>({
    name: 'Temuulen Undrakhbayar',
    position: 'Software Developer',
    imageUrl: 'https://avatars.githubusercontent.com/u/75017829?v=4',
  });

  // Load stored data on initial render
  useEffect(() => {
    const storedData = loadStoredData();
    if (storedData.clockInTime)
      setClockInTime(new Date(storedData.clockInTime));
    if (storedData.clockOutTime)
      setClockOutTime(new Date(storedData.clockOutTime));
    setTotalWorkedToday(storedData.totalWorkedToday);
    setWeeklyHours(storedData.weeklyHours);
    setHourlyRate(storedData.hourlyRate);
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const dataToStore: StoredData = {
      clockInTime: clockInTime?.toISOString() || null,
      clockOutTime: clockOutTime?.toISOString() || null,
      totalWorkedToday,
      weeklyHours,
      hourlyRate,
    };
    saveToStorage(dataToStore);
  }, [clockInTime, clockOutTime, totalWorkedToday, weeklyHours, hourlyRate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let workedInterval: NodeJS.Timeout | null = null;
    if (clockInTime && !clockOutTime) {
      workedInterval = setInterval(() => {
        setTotalWorkedToday((prevTotal) => prevTotal + 1);
      }, 1000);
    }
    return () => {
      if (workedInterval) clearInterval(workedInterval);
    };
  }, [clockInTime, clockOutTime]);

  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setClockOutTime(null);
    setTotalWorkedToday(0);
  };

  const handleClockOut = () => {
    const now = new Date();
    setClockOutTime(now);
    if (clockInTime) {
      const todayIndex = now.getDay() - 1;
      if (todayIndex >= 0 && todayIndex < 5) {
        const workedToday = differenceInSeconds(now, clockInTime) / 3600;
        setWeeklyHours((prev) => {
          const newWeekly = [...prev];
          newWeekly[todayIndex] = workedToday;
          return newWeekly;
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateDailyEarnings = () => {
    return ((totalWorkedToday / 3600) * hourlyRate).toFixed(2);
  };

  const calculateWeeklyEarnings = () => {
    return weeklyHours
      .reduce((total, hours) => total + hours * hourlyRate, 0)
      .toFixed(2);
  };

  const isWorkingHours =
    currentTime.getHours() >= 9 && currentTime.getHours() < 17;
  const isWeekday = currentTime.getDay() > 0 && currentTime.getDay() < 6;

  return (
    <main className='flex min-h-screen flex-col items-center justify-center'>
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Tardy - Working Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={employee.imageUrl} alt={employee.name} />
              <AvatarFallback>
                {employee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className='text-xl font-semibold'>{employee.name}</h2>
              <p className='text-sm text-muted-foreground'>
                {employee.position}
              </p>
            </div>
          </div>
          <div className='text-center'>
            <div className='text-4xl font-bold mb-2' aria-live='polite'>
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <p className='text-sm text-muted-foreground'>
              <Calendar className='inline mr-2 h-4 w-4' />
              {format(currentTime, 'EEEE, MMMM do yyyy')}
            </p>
          </div>
          <div className='flex justify-center space-x-2'>
            <Button
              onClick={handleClockIn}
              disabled={!!clockInTime || !isWorkingHours || !isWeekday}
            >
              Clock In
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={!clockInTime || !!clockOutTime}
            >
              Clock Out
            </Button>
          </div>
          <div className='text-center'>
            <p className='text-lg font-semibold'>
              Status:{' '}
              <span
                className={
                  clockInTime && !clockOutTime
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              >
                {clockInTime && !clockOutTime ? 'At Work' : 'Off Work'}
              </span>
            </p>
            <p className='text-sm'>
              <Clock className='inline mr-2 h-4 w-4' />
              Hours Worked Today: {formatTime(totalWorkedToday)}
            </p>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='hourly-rate'>Hourly Rate ($)</Label>
            <Input
              id='hourly-rate'
              type='number'
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              min='0'
              step='0.01'
            />
          </div>
          <div className='text-center space-y-2'>
            <p className='text-sm'>
              <DollarSign className='inline mr-2 h-4 w-4' />
              Daily Earnings: ${calculateDailyEarnings()}
            </p>
            <p className='text-sm'>
              <DollarSign className='inline mr-2 h-4 w-4' />
              Weekly Earnings: ${calculateWeeklyEarnings()}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <div className='w-full'>
            <h3 className='text-lg font-semibold mb-2'>Weekly Summary</h3>
            <div className='grid grid-cols-5 gap-2'>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                <div key={day} className='text-center'>
                  <div className='text-sm font-medium'>{day}</div>
                  <div className='text-xs'>
                    {weeklyHours[index].toFixed(2)}h
                  </div>
                  <div className='text-xs'>
                    ${(weeklyHours[index] * hourlyRate).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
