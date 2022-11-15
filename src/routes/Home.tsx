import { h, } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import style from './home.css';
import { ConfigContext, ServiceContext } from '../AppContext';
import { Note, Token, WidgetApi } from '../models';
import parseDate from '../utils/parseDate';
import getTextByTag from '../utils/getTextByTag';
import formatAccount from '../utils/formatAccount';
import clsx from 'clsx';
import formatValue from '../utils/formatValue';
import getTypeOfMedia from '../utils/getTypeOfMedia';

const Home = () => {
  const config = useContext(ConfigContext);
  const service = useContext(ServiceContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cursor, setCursor] = useState<string | undefined>('');
  const [ensList, setEnsList] = useState<{ [key: string]: string; }>({});
  const [loading, setLoading] = useState(true);

  const addEns = (ens: string, address: string) => {
    setEnsList((prev) => {
      return {
        ...prev,
        [address]: ens
      };
    });
  };

  const getNotes = async (service: WidgetApi) => {
    if (config.accounts.length === 1) {
      const { result, cursor: nextCursor, total } =
        await service.getNotesByInstance(
          config.accounts[0],
          {
            network: config.networks,
            tag: config.tags,
            limit: config.limit,
            platform: config.platforms,
            cursor
          });
      setNotes((prev) => [...prev, ...result]);
      if (total < config.limit) {
        setCursor(undefined);
      } else {
        setCursor(nextCursor);
      }
    } else if (config.accounts.length > 1) {
      const { result, cursor: nextCursor, total } =
        await service.getNotesByList({
          address: config.accounts,
          network: config.networks,
          tag: config.tags,
          limit: config.limit,
          platform: config.platforms,
          cursor
        });
      setNotes((prev) => [...prev, ...result]);
      if (total < config.limit) {
        setCursor(undefined);
      } else {
        setCursor(nextCursor);
      }
    } else {
      return;
    }
  };

  useEffect(() => {
    if (!service) {
      return;
    }
    getNotes(service).then(() => console.log('fetching notes'));
  }, [service]);

  useEffect(() => {
    if (!service || !(notes.length > 0)) {
      return;
    }

    for (const note of notes) {
      const addressFrom = note.address_from;
      const adrressTo = note.actions[0].address_to || note.address_to;
      if (!(addressFrom in ensList)) {
        service.getProfileByInstance(addressFrom).then((response: any) => {
          if (response.total > 0) {
            addEns(response.result[0].handle, response.result[0].address);
          } else {
            addEns(addressFrom, addressFrom);
          }
        });
      }
      if (!(adrressTo in ensList)) {
        service.getProfileByInstance(adrressTo).then((response: any) => {
          if (response.total > 0) {
            addEns(response.result[0].handle, response.result[0].address);
          } else {
            addEns(adrressTo, adrressTo);
          }
        });
      }
    }
    setLoading(false);
  }, [service, notes]);

  return (
    <div className={style.main}>
      {loading && <p>Loading...</p>}
      {!loading &&
        notes.map((note) => (
          <div className={style.note}>
            <div className={style.details}>
              <p>{note.network}</p>
              <p>{parseDate(note.timestamp)}</p>
            </div>
            <ActionItem note={note} ensList={ensList} />
          </div>
        ))
      }
      {!loading && cursor && <button onClick={() => {
        if (service) {
          getNotes(service).then(() => console.log('fetching notes'));
        }
      }}>more</button>}
    </div >);
};

const ActionItem = ({ note, ensList }: { note: Note; ensList: any }) => {
  if (note.tag === 'transaction') {
    return (
      <TransactionMetadata note={note} ensList={ensList} />
    );
  } else if (note.tag === 'exchange') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.protocol}</p>
        </div>
        {note.type === 'swap' ?
          <div className={style.metadata}>
            <img src={note.actions[0].metadata.from?.image} alt='' />
            <img src={note.actions[0].metadata.to?.image} alt='' />
            <p>{formatValue(note.actions[0].metadata.from?.value_display!)}{' '}
              <span className={style.bold}>{note.actions[0].metadata.from?.symbol}</span>
            </p>
            <p className={style.fs90}>for</p>
            <p>{formatValue(note.actions[0].metadata.to?.value_display!)}{' '}
              <span className={style.bold}>{note.actions[0].metadata.to?.symbol}</span>
            </p>
          </div>
          :
          <div>
            {note.actions[0].metadata.tokens?.map((token: Token) => (
              <div className={style.metadata}>
                <img src={token.image} alt='' />
                <p>{token.value_display}{' '}
                  <span className={style.bold}>{token.symbol}</span>
                </p>
                <p className={style.bold}>{token.symbol}</p>
              </div>
            ))
            }
          </div>
        }
        <a className={style.fs75} href={note.actions[0].related_urls[0]} target='_blank'>
          View in explorer
        </a>
      </div>
    );
  } else if (note.tag === 'social') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].platform}</p>
        </div>

        <a href={
          note.type === 'post' ? (
            note.actions[0].related_urls.length > 1 ? note.actions[0].related_urls[1] : note.actions[0].related_urls[0]
          ) : note.actions[0].metadata.target?.target_url
        } target='_blank'>
          <p className={style.fs90}>
            {note.actions[0].metadata.title ?
              note.actions[0].metadata.title :
              note.actions[0].metadata.body
            }
          </p>
          <div className={style.metadata}>
            <div className={style.target}>

              {
                note.actions[0].metadata.target?.media &&
                note.actions[0].metadata.target?.media[0].mime_type.startsWith('image') &&
                <img src={note.actions[0].metadata.target?.media[0].address} />
              }
              <p className={style.fs75}>{note.actions[0].metadata.target?.body}</p>
            </div>
          </div>
        </a>
      </div>
    );
  } else if (note.tag === 'donation') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.token?.value_display?.substring(0, 5)}</p>
          <p className={style.bold}>{note.actions[0].metadata.token?.symbol}</p>
        </div>
        <a href={note.actions[0].related_urls[1]} target='_blank'>
          <div className={style.metadata}>
            <div className={style.target}>
              <img src={note.actions[0].metadata.logo} alt='' />
              <div>
                <p className={style.fs90}>{note.actions[0].metadata.title}</p>
                <p className={style.fs75}>{note.actions[0].metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  } else if (note.tag === 'collectible') {
    return (
      <CollectibleMetadata note={note} ensList={ensList} />
    );
  } else if (note.tag === 'governance') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.proposal?.organization.name}</p>
        </div>
        <a href={note.actions[0].related_urls[0]} target='_blank'>
          <div className={style.metadata}>
            <div className={style.target}>
              <div>
                <p className={clsx([style.fs90, style.bold])}>{note.actions[0].metadata.proposal?.title}</p>
                <p className={style.fs75}>{note.actions[0].metadata.proposal?.body}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  } else {
    return <div>working..</div>;
  }
};

const TransactionMetadata = ({ note, ensList }: { note: Note; ensList: any }) => {
  if (note.type === 'transfer') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{formatAccount(note.actions[0].address_to, ensList)}</p>
        </div>
        <div className={style.metadata}>
          {note.actions[0].metadata.image && <img src={note.actions[0].metadata.image} alt='' />}
          <p>{formatValue(note.actions[0].metadata.value_display!)}{' '}
            <span className={style.bold}>{note.actions[0].metadata.symbol}</span>
          </p>
        </div>
        <a className={style.fs75} href={note.actions[0].related_urls[0]} target='_blank'>
          View in explorer
        </a>
      </div>
    );
  } else if (note.type === 'mint') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
        </div>
        <div className={style.metadata}>
          {note.actions[0].metadata.image && <img src={note.actions[0].metadata.image} alt='' />}
          <p>{formatValue(note.actions[0].metadata.value_display!)}{' '}
            <span className={style.bold}>{note.actions[0].metadata.symbol}</span>
          </p>
        </div>
        <a className={style.fs75} href={note.actions[0].related_urls[0]} target='_blank'>
          View in explorer
        </a>
      </div>
    );
  } else if (note.type === 'burn') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
        </div>
        {
          note.actions.map((action) => action.type === 'burn' && (
            <div>
              <div className={style.metadata}>
                {action.metadata.image && <img src={action.metadata.image} alt='' />}
                <p>{formatValue(action.metadata.value_display!)}{' '}
                  <span className={style.bold}>{action.metadata.symbol}</span>
                </p>
              </div>
              <a className={style.fs75} href={action.related_urls[0]} target='_blank'>
                View in explorer
              </a>
            </div>
          ))
        }
      </div>
    );
  } else {
    return <p>working</p>;
  }
};

const CollectibleMetadata = ({ note, ensList }: { note: Note; ensList: any; }) => {
  if (note.type === 'transfer' || note.type === 'trade') {
    return (
      <div>
        {
          note.actions.map((action) => (
            action.tag === 'collectible' &&
            <div>
              <div className={style.action}>
                <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
                <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
                <p className={style.bold}>{formatAccount(action.address_to, ensList)}</p>
              </div>
              {note.type === 'trade' &&
                <div className={style.action}>
                  <p className={style.fs90}>for</p>
                  <p>{action.metadata.cost?.value_display}</p>
                  <p className={style.bold}>{action.metadata.cost?.symbol}</p>
                </div>
              }
              <a href={action.related_urls[1]} target='_blank'>
                <div className={style.metadata}>
                  <div className={style.target}>
                    {action.metadata.image && <MediaItem url={action.metadata.image} />}
                    <div>
                      <p className={style.fs75}>{action.metadata.collection}</p>
                      <p className={clsx([style.fs90, style.bold])}>{action.metadata.name}</p>
                      <p className={style.fs75}>{action.metadata.description}</p>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))
        }
      </div>
    );
  } else if (note.type === 'mint' || note.type === 'mint') {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
        </div>
        <a href={note.actions[0].related_urls[1]} target='_blank'>
          <div className={style.metadata}>
            <div className={style.target}>
              {
                note.actions[0].metadata.image &&
                <MediaItem url={note.actions[0].metadata.image} />
              }
              <div>
                <p className={style.fs75}>{note.actions[0].metadata.collection}</p>
                <p className={clsx([style.fs90, style.bold])}>{note.actions[0].metadata.name}</p>
                <p className={style.fs75}>{note.actions[0].metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  } else {
    return <p>working...</p>;
  }
};

const MediaItem = ({url}: {url: string}) => {
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState('');
  useEffect(() => {
    getTypeOfMedia(url).then((type) => {
      setMediaType(type);
      setLoading(false);
    });
  }, [url]);

  if (!loading) {
    if (mediaType === 'image') {
      return <img src={url} alt='' />;
    } else if (mediaType === 'video') {
      return <video autoPlay loop src={url} style='width: 64px; height: 64px; border-radius: 0.75rem;'></video>;
    } else {
      return <Spinner />;
    }
  } else {
    return <Spinner />;
  }
};

const Spinner = () => {
  return (
    <svg
    className={style.spinner}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 59.94 59.94'
      style={{
        enableBackground: 'new 0 0 59.94 59.94',
      }}
      xmlSpace='preserve'
    >
      <path d='M30.694 59.94a1.999 1.999 0 0 1-.058-3.999c.314-.009.628-.022.939-.042 1.12-.084 2.051.771 2.119 1.873a1.999 1.999 0 0 1-1.873 2.119 37.63 37.63 0 0 1-1.068.048l-.059.001zm-5.998-.472c-.121 0-.244-.011-.368-.034-.356-.066-.71-.139-1.062-.219a2 2 0 0 1 .887-3.901c.301.068.604.131.907.188a1.999 1.999 0 0 1-.364 3.966zm12.934-.588a2 2 0 0 1-.545-3.925c.299-.085.595-.176.89-.271a2.001 2.001 0 0 1 1.237 3.805c-.342.111-.687.216-1.034.314a2.008 2.008 0 0 1-.548.077zm-19.617-1.562c-.284 0-.572-.061-.847-.188a29.13 29.13 0 0 1-.972-.477 2 2 0 1 1 1.83-3.556c.275.142.555.278.837.41a2 2 0 0 1-.848 3.811zm26.074-1.196a1.999 1.999 0 0 1-1.011-3.726c.267-.156.53-.318.791-.484a2 2 0 0 1 2.149 3.375c-.304.193-.61.381-.922.563a2.003 2.003 0 0 1-1.007.272zM12.08 53.564c-.449 0-.9-.15-1.273-.458a28.874 28.874 0 0 1-.819-.703 1.999 1.999 0 1 1 2.66-2.986c.231.206.468.407.708.605a2 2 0 0 1-1.276 3.542zm37.564-1.721a2 2 0 0 1-1.411-3.417c.222-.221.439-.445.654-.674a2.001 2.001 0 0 1 2.914 2.74c-.244.26-.493.516-.746.768-.389.389-.9.583-1.411.583zM7.271 48.456a1.997 1.997 0 0 1-1.618-.821c-.211-.29-.418-.585-.618-.881a2 2 0 0 1 3.316-2.238c.173.257.351.511.534.762a2.001 2.001 0 0 1-1.614 3.178zm46.696-2.14a2 2 0 0 1-1.715-3.024c.16-.269.315-.539.466-.813a2 2 0 1 1 3.506 1.928c-.174.315-.353.627-.536.935a2.007 2.007 0 0 1-1.721.974zM3.882 42.312a2 2 0 0 1-1.86-1.265 28.228 28.228 0 0 1-.379-1.008 2 2 0 0 1 3.77-1.338c.104.294.214.584.328.873a2 2 0 0 1-1.859 2.738zm52.897-2.427a2 2 0 0 1-1.921-2.561c.087-.299.17-.601.248-.904a1.994 1.994 0 0 1 2.433-1.442 2 2 0 0 1 1.442 2.433c-.088.347-.184.691-.283 1.035a2.001 2.001 0 0 1-1.919 1.439zm-54.646-4.37a2 2 0 0 1-1.981-1.748 27.112 27.112 0 0 1-.115-1.078 1.999 1.999 0 0 1 1.818-2.166c1.122-.112 2.07.719 2.166 1.818.027.31.061.617.1.922a2 2 0 0 1-1.988 2.252zm55.762-2.559-.071-.001a2 2 0 0 1-1.929-2.069c.011-.311.017-.622.017-.935v-.113a2 2 0 0 1 4 0v.113c0 .359-.006.718-.019 1.075a2 2 0 0 1-1.998 1.93zm-55.77-4.459a2 2 0 0 1-1.988-2.244c.044-.356.094-.711.149-1.062a2 2 0 0 1 3.951.621 28.05 28.05 0 0 0-.13.929 2 2 0 0 1-1.982 1.756zm55.124-2.642a2 2 0 0 1-1.951-1.57c-.067-.303-.14-.605-.217-.904a1.998 1.998 0 0 1 1.433-2.438 1.996 1.996 0 0 1 2.438 1.433c.091.348.175.697.252 1.051a2 2 0 0 1-1.955 2.428zM3.84 21.693a1.999 1.999 0 0 1-1.86-2.732c.132-.337.27-.671.413-1a1.997 1.997 0 0 1 2.633-1.033 1.999 1.999 0 0 1 1.033 2.633 25.09 25.09 0 0 0-.356.861 2.003 2.003 0 0 1-1.863 1.271zm51.047-2.444a1.996 1.996 0 0 1-1.788-1.101 21.801 21.801 0 0 0-.433-.814 2 2 0 0 1 3.498-1.942c.175.315.345.635.507.957a2 2 0 0 1-1.784 2.9zM7.206 15.532a2 2 0 0 1-1.619-3.172c.211-.292.428-.58.65-.865a2.001 2.001 0 0 1 3.151 2.465c-.191.245-.377.493-.559.744a2 2 0 0 1-1.623.828zm43.744-2.087c-.557 0-1.109-.23-1.505-.682a27.181 27.181 0 0 0-.625-.686 1.999 1.999 0 1 1 2.902-2.752c.249.262.492.528.73.801a1.998 1.998 0 0 1-.186 2.822 1.982 1.982 0 0 1-1.316.497zm-38.948-3.041a2 2 0 0 1-1.279-3.539c.275-.229.555-.451.837-.67a2 2 0 0 1 2.45 3.162c-.247.191-.491.387-.731.586-.375.31-.827.461-1.277.461zm33.687-1.608c-.389 0-.781-.113-1.126-.349a25.98 25.98 0 0 0-.778-.51 2 2 0 1 1 2.129-3.387c.306.192.607.39.905.594a2 2 0 0 1-1.13 3.652zM17.915 6.631a2.001 2.001 0 0 1-.856-3.809c.323-.152.649-.3.978-.44a1.996 1.996 0 0 1 2.627 1.047 1.998 1.998 0 0 1-1.047 2.627 26.9 26.9 0 0 0-.849.384c-.276.13-.567.191-.853.191zm21.524-1.026c-.225 0-.453-.038-.676-.119a30.84 30.84 0 0 0-.888-.301 2 2 0 0 1 1.217-3.811c.344.109.685.226 1.022.348A1.999 1.999 0 0 1 41.32 4.28a1.998 1.998 0 0 1-1.881 1.325zM24.58 4.454a2.001 2.001 0 0 1-.372-3.965c.352-.066.706-.129 1.062-.183a2 2 0 0 1 .605 3.953c-.309.048-.614.101-.919.159a2.01 2.01 0 0 1-.376.036zm8.01-.378c-.063 0-.126-.003-.189-.009a23.69 23.69 0 0 0-.931-.07 2.002 2.002 0 0 1-1.881-2.113A2.003 2.003 0 0 1 31.702.003c.359.021.718.049 1.073.082a2 2 0 0 1-.185 3.991z' />
    </svg>
  );
};

export default Home;
