import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import * as tf from '@tensorflow/tfjs';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

import { Footer, Table, DarkThemeToggle, Tabs } from 'flowbite-react';
import { BsFacebook, BsGithub, BsInstagram } from 'react-icons/bs';
import { MdDashboard, MdSchedule } from 'react-icons/md';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { database } from './firebase';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const App = () => {
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [forecastsLabels, setForecastsLabels] = useState([]);
  const [forecastsValues, setForecastsValues] = useState([]);

  useEffect(() => {
    const starCountRef = ref(database, 'sensor');

    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();

      const _data = Object.values(data);
      _data.reverse();

      setData(_data);

      const _dataChart = Object.values(data);

      const horasUnicasPorDia = {};
      _dataChart.forEach((objeto) => {
        const fecha = moment(objeto.currentDateTime, 'YYYY-MM-DD HH:mm:ss');
        const dia = fecha.format('YYYY-MM-DD');
        const hora = fecha.format('HH:00');

        if (!horasUnicasPorDia[dia]) {
          horasUnicasPorDia[dia] = new Set();
        }
        horasUnicasPorDia[dia].add(hora);
      });

      const elementosTexto = [];
      Object.entries(horasUnicasPorDia).forEach(([dia, horasSet]) => {
        horasSet.forEach((hora) => {
          elementosTexto.push(`${hora} - ${dia}`);
        });
      });

      setLabels(elementosTexto);

      const totalRegistros = [];

      elementosTexto.forEach((elemento) => {
        const [hora, dia] = elemento.split(' - ');
        const cantidadRegistros = _dataChart.filter(
          (objeto) =>
            moment(objeto.currentDateTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') === dia &&
            moment(objeto.currentDateTime, 'YYYY-MM-DD HH:mm:ss').format('HH:00') === hora
        ).length;
        totalRegistros.push(cantidadRegistros);
      });

      setValues(totalRegistros);

      //machine learning

      const _machineLearningData = generateDemoData();

      // const _machineLearningData = [
      //   { day: 1, hour: 8, count: 5 },
      //   { day: 2, hour: 10, count: 10 },
      //   { day: 3, hour: 15, count: 14 },
      // ];

      const X = _machineLearningData.map((item) => [item.day, item.hour]);
      const y = _machineLearningData.map((item) => item.count);
      trainModel(X, y);
    });

    return () => off(starCountRef);
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 20,
          },
        },
      },
      title: {
        display: true,
        text: 'Ingreso de Clientes',
        color: 'white',
        font: {
          size: 30,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: 'white',
          font: {
            size: 15,
          },
        },
        grid: {
          color: '#1c2c34',
        },
      },
      x: {
        ticks: {
          color: 'white',
          font: {
            size: 10,
          },
        },
        grid: {
          color: '#1c2c34',
        },
      },
    },
  };

  const dataline = {
    labels,
    datasets: [
      {
        label: 'Clientes',
        data: values,
        borderColor: 'white',
        backgroundColor: 'black',
        tension: 0.1,
      },
    ],
  };

  //forecasts chart
  const optionsForecasts = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 20,
          },
        },
      },
      title: {
        display: true,
        text: 'Pronóstico de la Semana',
        color: 'white',
        font: {
          size: 30,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: 'white',
          font: {
            size: 15,
          },
        },
        grid: {
          color: '#1c2c34',
        },
      },
      x: {
        ticks: {
          color: 'white',
          font: {
            size: 10,
          },
        },
        grid: {
          color: '#1c2c34',
        },
      },
    },
  };

  const dataForecasts = {
    labels: forecastsLabels,
    datasets: [
      {
        label: 'Clientes',
        data: forecastsValues,
        borderColor: 'white',
        backgroundColor: 'black',
        tension: 0.1,
      },
    ],
  };

  //machine learning
  const trainLinearRegressionModel = async (X, y) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    const xs = tf.tensor2d(X, [X.length, 2]);
    const ys = tf.tensor2d(y, [y.length, 1]);

    await model.fit(xs, ys, { epochs: 100 });

    return model;
  };

  const trainModel = async (X, y) => {
    const model = await trainLinearRegressionModel(X, y);

    const currentDate = new Date();

    const targetData = [];
    const startDay = currentDate.getDay();
    const endDay = startDay + 7;

    for (let day = startDay + 1; day <= endDay; day++) {
      const dayOfWeek = day > 7 ? day - 7 : day;

      for (let hour = 8; hour <= 20; hour++) {
        targetData.push({ day: dayOfWeek, hour });
      }
    }

    const input = tf.tensor2d(
      targetData.map((item) => [item.day, item.hour]),
      [targetData.length, 2]
    );

    const predictions = model.predict(input);
    const predictedCounts = predictions.dataSync();

    const _targetData = targetData.map((item, index) => ({
      ...item,
      total: parseInt(predictedCounts[index]),
    }));

    // Obtener los elementos únicos de la primera propiedad
    let uniqueElements = Array.from(new Set(_targetData.map((obj) => obj.day)));

    uniqueElements = uniqueElements.map((item) => getDay(item));

    setForecastsLabels(uniqueElements ?? []);

    // Obtener la suma de la tercera propiedad

    const sumByProp1 = _targetData.reduce((accumulator, obj) => {
      const prop1Value = obj.day;
      const prop3Value = obj.total;

      if (!accumulator[prop1Value]) {
        accumulator[prop1Value] = prop3Value;
      } else {
        accumulator[prop1Value] += prop3Value;
      }

      return accumulator;
    }, {});

    const sumValues = Object.values(sumByProp1);

    setForecastsValues(sumValues ?? []);

    setForecasts(_targetData ?? []);
  };

  const generateDemoData = () => {
    const data = [];

    for (let day = 1; day <= 7; day++) {
      for (let hour = 8; hour <= 10; hour++) {
        const count = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
        data.push({ day, hour: hour, count: count });
      }
    }

    return data;
  };

  const getDay = (item) => {
    let _day = '';

    switch (item) {
      case 1:
        _day = 'Lunes';
        break;
      case 2:
        _day = 'Martes';
        break;
      case 3:
        _day = 'Miércoles';
        break;
      case 4:
        _day = 'Jueves';
        break;
      case 5:
        _day = 'Viernes';
        break;
      case 6:
        _day = 'Sábado';
        break;
      case 7:
        _day = 'Domingo';
        break;

      default:
        break;
    }

    return _day;
  };

  return (
    <div className='dark:bg-gray-600 h-screen p-8'>
      <DarkThemeToggle className='absolute top-10 right-10' theme={'dark'} />

      <Tabs.Group aria-label='Default tabs' style='default'>
        <Tabs.Item active icon={MdDashboard} title='Dashboard'>
          <div className='w-full flex flex-row mb-5' style={{ height: '500px' }}>
            <div className='w-1/2 flex justify-center items-center flex-col'>
              <a
                className='bg-cyan-300 p-3 mb-2 '
                target='_blank'
                href='https://colab.research.google.com/drive/1srARKPEm8IxaTLpUJ_1tVEe4_G3jw0kC'>
                Machine learning
              </a>
              <Line options={options} data={dataline} className='bg-gray-700 dark:bg-transparent' />
            </div>

            <div className='w-1/2'>
              <Table>
                <Table.Body>
                  <Table.Cell className='bg-gray-700 w-1/3 rounded-tl-3xl text-white'>
                    Tiempo
                  </Table.Cell>
                  <Table.Cell className='bg-gray-700 w-2/5 text-white pl-12'>Mensaje</Table.Cell>
                  <Table.Cell className='bg-gray-700 text-white'>Chip V.</Table.Cell>
                  <Table.Cell className='bg-gray-700 rounded-tr-3xl text-white'>Puerto</Table.Cell>
                </Table.Body>
              </Table>

              <div
                style={{ maxHeight: '90%', overflowY: 'auto' }}
                className='border-b-2 border-x-2 border-gray-700'>
                <Table striped hoverable>
                  <Table.Body className='divide-y'>
                    {data.map((item, index) => (
                      <Table.Row
                        key={index}
                        className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                        <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white '>
                          {item?.currentDateTime}
                        </Table.Cell>
                        <Table.Cell>{item?.mensaje}</Table.Cell>
                        <Table.Cell>{item?.chip_version}</Table.Cell>
                        <Table.Cell>{item?.puerto}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>
        </Tabs.Item>

        <Tabs.Item icon={MdSchedule} title='Pronósticos'>
          <div className='w-full flex flex-row mb-5' style={{ height: '500px' }}>
            <div className='w-1/2 flex justify-center items-center'>
              <Line
                options={optionsForecasts}
                data={dataForecasts}
                className='bg-gray-700 dark:bg-transparent'
              />
            </div>

            <div className='w-1/2'>
              <Table>
                <Table.Body>
                  <Table.Cell className='bg-gray-700 w-2/5 rounded-tl-3xl text-white'>
                    Día de la Semana
                  </Table.Cell>
                  <Table.Cell className='bg-gray-700 w-1/4 text-white pl-10'>Hora</Table.Cell>
                  <Table.Cell className='bg-gray-700 rounded-tr-3xl pl-20 text-white'>
                    Total de Clientes
                  </Table.Cell>
                </Table.Body>
              </Table>

              <div
                style={{ maxHeight: '90%', overflowY: 'auto' }}
                className='border-b-2 border-x-2 border-gray-700'>
                <Table striped hoverable>
                  <Table.Body className='divide-y'>
                    {forecasts.map((item, index) => (
                      <Table.Row
                        key={index}
                        className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                        <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white '>
                          {getDay(item?.day)}
                        </Table.Cell>
                        <Table.Cell>{`${item?.hour}:00`}</Table.Cell>
                        <Table.Cell>{item?.total}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>
        </Tabs.Item>
      </Tabs.Group>

      <Footer container className='bg-gray-700'>
        <Footer.Copyright
          by='Sensor App by @allegseu95'
          href='#'
          year={2023}
          className='text-white'
        />
        <Footer.LinkGroup>
          <Footer.Link href='#'>
            <Footer.Icon
              href='https://www.facebook.com/AlexSantacruz95'
              icon={BsFacebook}
              className='text-white'
            />
          </Footer.Link>
          <Footer.Link href='#'>
            <Footer.Icon
              href='https://www.instagram.com/alex.santacruz.mrls/?igshid=ZDc4ODBmNjlmNQ%3D%3D'
              icon={BsInstagram}
              className='text-white'
            />
          </Footer.Link>
          <Footer.Link href='#'>
            <Footer.Icon
              href='https://github.com/Allegseu95'
              icon={BsGithub}
              className='text-white'
            />
          </Footer.Link>
        </Footer.LinkGroup>
      </Footer>
    </div>
  );
};
