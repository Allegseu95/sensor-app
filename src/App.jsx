import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { Footer, Table, DarkThemeToggle } from 'flowbite-react';
import { BsFacebook, BsGithub, BsInstagram } from 'react-icons/bs';
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
import { Line } from 'react-chartjs-2';
import moment from 'moment';

import { database } from './firebase';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const App = () => {
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);

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
        text: 'Movimientos Detectados',
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
        label: 'Movimientos',
        data: values,
        borderColor: 'white',
        backgroundColor: 'black',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className='dark:bg-gray-600 h-screen p-8'>
      <h1 className='dark:text-white text-center text-4xl'>DASHBOARD</h1>
      <DarkThemeToggle className='absolute top-7 right-5' theme={'dark'} />

      <div className='w-full flex flex-row h-5/6 my-4 p-5'>
        <div className='w-1/2 flex justify-center items-center'>
          <Line options={options} data={dataline} />
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

          <div style={{ maxHeight: '95%', overflowY: 'auto' }}>
            <Table striped hoverable>
              <Table.Body className='divide-y'>
                {data.map((item, index) => (
                  <Table.Row key={index} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
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

      <Footer container>
        <Footer.Copyright by='Sensor App by @allegseu95' href='#' year={2023} />
        <Footer.LinkGroup>
          <Footer.Link href='#'>
            <Footer.Icon href='https://www.facebook.com/AlexSantacruz95' icon={BsFacebook} />
          </Footer.Link>
          <Footer.Link href='#'>
            <Footer.Icon
              href='https://www.instagram.com/alex.santacruz.mrls/?igshid=ZDc4ODBmNjlmNQ%3D%3D'
              icon={BsInstagram}
            />
          </Footer.Link>
          <Footer.Link href='#'>
            <Footer.Icon href='https://github.com/Allegseu95' icon={BsGithub} />
          </Footer.Link>
        </Footer.LinkGroup>
      </Footer>
    </div>
  );
};
