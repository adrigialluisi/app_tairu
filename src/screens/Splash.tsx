import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shell/Button';
import styles from './Splash.module.css';

export function Splash() {
  const navigate = useNavigate();

  return (
    <div className={styles.screen}>
      <div className={styles.brand}>
        {/*
          Logo em transparência, sem card/sombra por trás. É monocromática
          (#110F0D, quase preta) — sobre o fundo branco (ver Splash.module.css)
          o contraste passa de 18:1, bem acima do grafismo leve de pontinhos
          (~6% de opacidade) que fica atrás do conteúdo.
          Versão com tagline embutida no SVG — sem texto de tagline solto.
        */}
        <img src={`${import.meta.env.BASE_URL}logo/LogoTairu_Tagline.svg`} alt="Tairu" className={styles.logoImg} />
      </div>
      <div className={styles.footer}>
        <Button variant="primary" fullWidth onClick={() => navigate('/inicio')}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
