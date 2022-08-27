import { useEffect, useState } from 'react';
import _ from 'lodash';
import { io } from 'socket.io-client';
import { VStack, Stack, Grid, GridItem, Center, Box, FormControl, FormLabel, Switch, Tag, Stat, StatLabel, StatNumber, StatHelpText, Text, Input } from '@chakra-ui/react';
import { Virtuoso } from 'react-virtuoso';
import moment from 'moment';
import LogEvents from '../lib/constants/LogEvents';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [filterCriteria, setFilterCriteria] = useState('');
  const [orderByDesc, setOrderByDesc] = useState(true);
  const [logs, setLogs] = useState([]);
  const [wsClient, setSocketClient] = useState(null);

  useEffect(() => {
    if (wsClient) {
      return;
    }

    const ws = new io(`ws://localhost:${3000}`);

    ws.on(LogEvents.GET_ALL_LOGS, serverLogs => setLogs([...serverLogs]));
    ws.on(LogEvents.SEARCH_LOGS, serverLogs => setLogs([...serverLogs]));

    ws.on(LogEvents.NEW_LOG, serverLogs => setLogs([...serverLogs]));

    ws.emit(LogEvents.GET_ALL_LOGS);

    setSocketClient(ws);
  }, [wsClient]);

  const renderCard = (_index, log) => {
    let color = '#FFFFFF';
    switch (log.msg.severityCode) {
      case 0:
        color = '#dc3545';
        break;
      case 1:
        color = '#dc3545';
        break;
      case 2:
        color = '#dc3545';
        break;
      case 3:
        color = '#dc3545';
        break;
      case 4:
        color = '#ffc107';
        break;
      case 5:
        color = '#17a2b8';
        break;
      case 6:
        color = '#007bff';
        break;
      case 7:
        color = '#28a745';
        break;
    }

    const timestamp = moment(log.msg.timestamp);

    return (
      <Box borderWidth='1px' margin={3} padding={3} borderRadius='lg' overflow='hidden'>
        <Grid templateColumns='1fr 2fr 2fr 6fr'>
          <GridItem>
            <Center height='100%'>
              <VStack>
                <Tag size='lg' borderRadius={5} backgroundColor={color} color='white'>{log.msg.severityCode}</Tag>
                <Text as='sub'>{log.msg.severity}</Text>
              </VStack>
            </Center>
          </GridItem>
          <GridItem>
            <Stat>
              <StatLabel>{log.msg.address}:{log.msg.port}</StatLabel>
              <StatNumber>{log.msg.hostname}</StatNumber>
              <StatHelpText>{timestamp.format('lll')}</StatHelpText>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat>
              <StatLabel>Process</StatLabel>
              <StatNumber>{log.msg.facility} ({log.msg.facilityCode})</StatNumber>
              <StatHelpText>{log.msg.tag}</StatHelpText>
            </Stat>
          </GridItem>
          <GridItem>
            <Center h="100%">
              <Text>{log.msg.msg.trim()}</Text>
            </Center>
          </GridItem>
        </Grid>
      </Box>
    );
  };

  const debouncedSearchEmit = _.debounce((searchCriteria) => wsClient.emit(LogEvents.SEARCH_LOGS, searchCriteria, orderByDesc), 1500);

  const onChangeFilterCriteria = (e) => {
    setFilterCriteria(e.target.value);
    debouncedSearchEmit(e.target.value);
  };

  const onChangeOrderBy = (e) => {
    setOrderByDesc(e.target.checked);
    wsClient.emit(LogEvents.SEARCH_LOGS, filterCriteria, e.target.checked);
  };

  return (
    <div className={styles.container}>
      <Stack direction='row' align='center'>
        <Input variant='flushed' placeholder='Search...' defaultValue={filterCriteria} onChange={onChangeFilterCriteria} />
        <FormControl display='flex' alignItems='center'>
          <FormLabel htmlFor='email-alerts' mb='0'>Recent first?</FormLabel>
          <Switch id='email-alerts' defaultChecked={orderByDesc} onChange={onChangeOrderBy} />
        </FormControl>
      </Stack>
      <Virtuoso style={{ width: '100%', minHeight: '90vh' }} data={logs} itemContent={renderCard} />
    </div>
  )
}
