import { h } from 'preact';
import style from './main.css';
import Home from '../routes/Home';
import { useContext } from 'preact/hooks';
import { ConfigContext } from '../AppContext';
import clsx from 'clsx';
import { Router, RouteComponent } from './Router';

const Main = () => {
    const config = useContext(ConfigContext);
    return (
        <div className={clsx(style.root, { [style.noDark]: config.disableDarkMode })}>
            <div>
                <div className={clsx(
                    style.container,
                    config.styles.classNameContainer)}>
                    <Router
                        routes={{
                            '/': <RouteComponent component={Home} />
                        }} />
                </div>
            </div>
        </div >);
};

export default Main;
