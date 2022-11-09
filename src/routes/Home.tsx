import { h, } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import style from './home.css';
import { ConfigContext, ServiceContext } from '../AppContext';
import { Action, Media, Note, Token, WidgetApi } from '../models';
import parseDate from '../utils/parseDate';
import getTextByTag from '../utils/getTextByTag';
import formatAccount from '../utils/formatAccount';
import { BsFillPlayBtnFill } from "react-icons/bs";
import clsx from 'clsx';


const Home = () => {
  const config = useContext(ConfigContext);
  const service = useContext(ServiceContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cursor, setCursor] = useState<string | undefined>("");
  const [ensList, setEnsList] = useState<{ [key: string]: string; }>({})
  const [loading, setLoading] = useState(true)

  const addEns = (ens: string, address: string) => {
    setEnsList((prev) => {
      return {
        ...prev,
        [address]: ens
      }
    })
  }

  const getNotes = async (service: WidgetApi) => {
    if (config.accounts.length == 1) {
      const { result, cursor: nextCursor, total } =
        await service.getNotesByInstance(
          config.accounts[0],
          {
            network: config.networks,
            tag: config.tags,
            limit: config.limit,
            platform: config.platforms,
            cursor: cursor
          })
      setNotes((prev) => { return [...prev, ...result] })
      if (total < config.limit) {
        setCursor(undefined)
      } else {
        setCursor(nextCursor)
      }
      console.log(result)
    }
    else if (config.accounts.length > 1) {
      const { result, cursor: nextCursor, total } = 
      await service.getNotesByList({ 
        address: config.accounts, 
        network: config.networks,
        tag: config.tags, 
        limit: config.limit,
        platform: config.platforms, 
        cursor: cursor 
      })
      setNotes((prev) => { return [...prev, ...result] })
      if (total < config.limit) {
        setCursor(undefined)
      } else {
        setCursor(nextCursor)
      }
      console.log(result)
    } else return
  }

  useEffect(() => {
    if (!service) return;
    getNotes(service).then(() => console.log("fetching notes"))
  }, [service]);

  useEffect(() => {
    if (!service || !(notes.length > 0)) return;
    for (let i = 0; i < notes.length; i++) {
      const addressFrom = notes[i].address_from;
      const adrressTo = notes[i].actions[0].address_to || notes[i].address_to;
      if (!(addressFrom in ensList)) {
        service.getProfileByInstance(addressFrom).then((response: any) => {
          if (response.total > 0) addEns(response.result[0].handle, response.result[0].address);
          else addEns(addressFrom, addressFrom);;
        })
      }
      if (!(adrressTo in ensList)) {
        service.getProfileByInstance(adrressTo).then((response: any) => {
          if (response.total > 0) addEns(response.result[0].handle, response.result[0].address);
          else addEns(adrressTo, adrressTo);;
        })
      }
    }
    setLoading(false)
  }, [service, notes])

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
            <ActionItem action={note.actions[0]} ensList={ensList} />
          </div>
        ))
      }
      {!loading && cursor && <button onClick={() => {
        if (service)
          getNotes(service).then(() => console.log("fetching notes"))
      }}>load more</button>}
    </div >);
};


const ActionItem = ({ action, ensList }: { action: Action; ensList: any }) => {
  if (action.tag == "transaction" && action.type == "transfer") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          <p className={style.bold}>{formatAccount(action.address_to, ensList)}</p>
        </div>
        <div className={style.metadata}>
          <img src={action.metadata.image} alt="" />
          <p>{action.metadata.value_display?.substring(0, 6)}</p>
          <p className={style.bold}>{action.metadata.symbol}</p>
        </div>
      </div>
    )
  } else if (action.tag == "exchange" && (action.type == "swap" || action.type == "liquidity" || action.type == "withdraw")) {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          <p className={style.bold}>{action.metadata.protocol}</p>
        </div>
        {action.type == "swap" ?
          <div className={style.metadata}>
            <img src={action.metadata.from?.image} alt="" />
            <img src={action.metadata.to?.image} alt="" />
            <p>{action.metadata.from?.value_display?.substring(0, 6)}</p>
            <p className={style.bold}>{action.metadata.from?.symbol}</p>
            <p className={style.fs90}>for</p>
            <p>{action.metadata.to?.value_display?.substring(0, 6)}</p>
            <p className={style.bold}>{action.metadata.to?.symbol}</p>
          </div>
          :
          <div>
            {action.metadata.tokens?.map((token: Token) => (
              <div className={style.metadata}>
                <img src={token.image} alt="" />
                <p>{token.value_display}</p>
                <p className={style.bold}>{token.symbol}</p>
              </div>
            ))
            }
          </div>
        }
      </div>
    )
  } else if (action.tag == "social") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          <p className={style.bold}>{action.platform}</p>
        </div>

        <a href={
          action.type == "post" ? (
            action.related_urls.length > 1 ? action.related_urls[1] : action.related_urls[0]
          ) : action.metadata.target?.target_url
        } target="_blank">
          <p className={style.fs90}>{action.metadata.title ? action.metadata.title : action.metadata.body}</p>
          <div className={style.metadata}>
            <div className={style.target}>

              {
                action.metadata.target?.media &&
                <MediaItem media={action.metadata.target?.media[0]} />
              }
              <p className={style.fs75}>{action.metadata.target?.body}</p>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (action.tag == "donation") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          <p className={style.bold}>{action.metadata.token?.value_display?.substring(0, 5)}</p>
          <p className={style.bold}>{action.metadata.token?.symbol}</p>
        </div>
        <a href={action.related_urls[1]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <img src={action.metadata.logo} alt="" />
              <div>
                <p className={style.fs90}>{action.metadata.title}</p>
                <p className={style.fs75}>{action.metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (action.tag == "collectible" && (action.type == "trade" || action.type == "mint")) {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.type != "mint" ? action.address_from : action.address_to, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          {action.type != "mint" && <p className={style.bold}>{formatAccount(action.address_to, ensList)}</p>}
        </div>
        {action.type == "trade" &&
          <div className={style.action}>
            <p className={style.fs90}>for</p>
            <p>{action.metadata.cost?.value_display}</p>
            <p className={style.bold}>{action.metadata.cost?.symbol}</p>
          </div>
        }
        <a href={action.related_urls[1]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <img src={
                action.metadata.image?.startsWith("ipfs://") ?
                  `https://ipfs.io/ipfs/${action.metadata.image.split("//")[1]}` :
                  action.metadata.image
              } alt="" />
              <div>
                <p className={style.fs75}>{action.metadata.collection}</p>
                <p className={clsx([style.fs90, style.bold])}>{action.metadata.name}</p>
                <p className={style.fs75}>{action.metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (action.tag == "governance" && action.type == "vote") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(action.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(action.tag, action.type)}</p>
          <p className={style.bold}>{action.metadata.proposal?.organization.name}</p>
        </div>
        <a href={action.related_urls[0]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <div>
                <p className={clsx([style.fs90, style.bold])}>{action.metadata.proposal?.title}</p>
                <p className={style.fs75}>{action.metadata.proposal?.body}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  }
  else {
    return <div>working..</div>
  }
}

const MediaItem = ({ media }: { media: Media }) => {
  if (media.mime_type.startsWith("image")) {
    return (
      <img src={media.address} alt="" />
    )
  } else return <BsFillPlayBtnFill />
}

export default Home;
