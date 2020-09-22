import React, { useState } from 'react';
import styled from 'styled-components';

import { getI18n } from '../../utils/i18n';
import * as api from '../../api/auth';
import { Button, Container, TextField, Section, LoadingDots } from '../../components';

const FullWidthTextField = styled(TextField)`
  flex: 1;
`;

const NonBorderFullWidthTextField = styled(FullWidthTextField)`
  border-top: 0;
`;

const NonBorderButton = styled(Button)`
  border-top: 0;
`;

const Join: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isSettingToken, setIsSettingToken] = useState(false);
  const [isSetToken, setIsSetToken] = useState(false);

  const i18n = getI18n({
    info: {
      ko: `이메일 주소를 인증하고 계정을 활성화할 수 있는 인증키가 발송되었습니다. 이메일(${email})을 확인해주세요.`,
      en: `Please check your email (${email}) to verify your email address and activate your account`,
    },
    signingUp: {
      ko: '안전한 암호화 알고리즘으로 회원가입 중입니다',
      en: 'Signing up with secure encryption algorithm',
    },
    signUp: {
      ko: '회원가입 ↗',
      en: 'Create account ↗',
    }
  });

  const setSignUpToken = async () => {
    setIsSettingToken(true);
    const result = await api.setSignUpToken(name, email, password, avatarUrl.trim());

    if (result) {
      setIsSettingToken(false);
      setIsSetToken(true);
    } else {
      setIsSettingToken(false);
    }
  };

  return <Container bottom={30}>
    {isSetToken ? (
      i18n.text('info')
    ) : (
      !isSettingToken ? (
        <>
          <Section row>
            <FullWidthTextField type='email' placeholder={i18n.text('email')} value={email} onChange={({ target: { value } }) => setEmail(value)} />
            <FullWidthTextField type='password' placeholder={i18n.text('password')} value={password} onChange={({ target: { value } }) => setPassword(value)}/>
            <FullWidthTextField type='text' placeholder={i18n.text('name')} value={name} onChange={({ target: { value } }) => setName(value)} />
          </Section>
          <Section row>
            <NonBorderFullWidthTextField type='url' placeholder={i18n.text('avatar')} value={avatarUrl} onChange={({ target: { value } }) => setAvatarUrl(value)} />
            <NonBorderButton onClick={setSignUpToken}>{i18n.text('signUp')}</NonBorderButton>
          </Section>
        </>
      ) : (
        <Section row>
          {i18n.text('signingUp')}
          <LoadingDots />
        </Section>
      )
    )}
  </Container>
};

export default Join;