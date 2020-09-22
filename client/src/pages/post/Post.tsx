import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import dayjs from 'dayjs';

import { getI18n } from '../../utils/i18n';
import * as api from '../../api/post';
import { Post, Session } from '../../models';
import { Button, Container, Section, TextField } from '../../components';
import Editor from './Editor';
import Preview from './Preview';
import { SaveStatus, getSaveStatusText } from '../../utils/status';

interface Props {
  session: Session | null;
}

enum ContentViewMode {
  EDITOR,
  PREVIEW,
}

const TitleTextField = styled(TextField)`
  font-size: 24px;
  font-weight: bold;
`;

const DateField = styled(({ ...other }) => <input type='date' {...other} />)`
  padding: 15px 5px 10px 5px;
  font-family: sans-serif;
  font-size: 16px;
  border: 0;
  border-bottom: 1px solid #000000;
`;

const SaveStatusText = styled.span`
  margin-top: 5px;
  align-self: center;
  font-size: 12px;
  color: #c0c0c0;
`;

const LinkLikeText = styled(SaveStatusText)`
  margin-left: 3px;
  cursor: pointer;
  color: #6fbfff;

  &:hover {
    text-decoration: underline;
  }
`;

const ContentViewModeSection = styled(Section)`
  justify-content: space-between;
`;

const ContentViewModeForm = styled.form`
  font-size: 12px;
  align-self: flex-end;
`;

const Radio = styled(({ ...other }) => <input type='radio' {...other} />)`
  margin: 0 3px 0 0;
`;

const PreviewRadio = styled(Radio)`
  margin-left: 7px;
`;

const DeleteButton = styled(Button)`
  font-size: 12px;
  max-width: 50px;
  align-self: flex-end;
  margin-top: 20px;
`;

const Post: React.FC<Props> = ({ session }) => {
  const i18n = getI18n({
    title: {
      ko: '제목',
      en: 'Title',
    },
    retry: {
      ko: '재시도',
      en: 'Retry',
    },
    editor: {
      ko: '에디터',
      en: 'Editor',
    },
    preview: {
      ko: '미리보기',
      en: 'Preview',
    },
    delete: {
      ko: '삭제',
      en: 'Delete',
    },
    deleteConfirm: {
      ko: '정말 삭제하시겠습니까?',
      en: 'Are you sure want to delete?'
    },
  });

  const getFormattedDate = (date?: string, withTime = false) => {
    const format = withTime ? 'YYYY-MM-DDT00:00:00' : 'YYYY-MM-DD';
    if (date) {
      return dayjs(date).format(format);
    }
    return dayjs().format(format);
  };

  const { id } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const dateFromQuery = query.get('date');

  const [postId, setPostId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getFormattedDate(dateFromQuery || undefined));
  const [content, setContent] = useState('');
  const [originalPost, setOriginalPost] = useState<Post | null>(null);

  const [contentViewMode, setContentViewMode] = useState(ContentViewMode.EDITOR);
  const [saveStatus, setSaveStatus] = useState(SaveStatus.NONE);
  const [isDeleted, setIsDeleted] = useState(false);

  const load = async () => {
    const post = await api.fetchPost(id, session?.user_public_key || '');

    if (post) {
      const { title, content, date } = post;
      setOriginalPost(post);
      setTitle(title);
      setDate(date);
      setContent(content);
    }
  };

  const upsertPost = async (newTitle: string | null = null, newDate: string | null = null, newContent: string | null = null) => {
    if (postId && originalPost) {
      if (
        newTitle && newTitle !== originalPost.title ||
        newDate && newDate !== getFormattedDate(originalPost.date) ||
        newContent && newContent !== originalPost.content
      ) {
        const dateWithTime = getFormattedDate(date, true);

        setSaveStatus(SaveStatus.ONGOING);
        const result = await api.updatePost(session?.user_public_key || '', postId, title, dateWithTime, content);

        if (result) {
          setSaveStatus(SaveStatus.SUCCESS);
        } else {
          setSaveStatus(SaveStatus.FAILURE);
        }
      }
    } else if (!postId) {
      if (title && date && content) {
        const dateWithTime = getFormattedDate(date, true);

        setSaveStatus(SaveStatus.ONGOING);
        const result = await api.createPost(session?.user_public_key || '', title, dateWithTime, content);

        if (result) {
          setPostId(result);
          setSaveStatus(SaveStatus.SUCCESS);
        } else {
          setSaveStatus(SaveStatus.FAILURE);
        }
      }
    }
  };

  const deletePost = async () => {
    if (postId && confirm(i18n.text('deleteConfirm'))) {
      const result = await api.deletePost(postId);
      if (result) {
        setIsDeleted(true);
      }
    }
  };

  useEffect(() => {
    if (id) {
      setPostId(id);
      setContentViewMode(ContentViewMode.PREVIEW);
      load();
    } else {
      setSaveStatus(SaveStatus.NONE);
    }
  }, []);

  return <Container bottom={30}>
    <TitleTextField
      placeholder={i18n.text('title')}
      value={title}
      onBlur={({ target: { value } }) => upsertPost(value)}
      onChange={({ target: { value } }) => setTitle(value)}
    />
    <DateField
      value={getFormattedDate(date)}
      onBlur={({ target: { value } }: { target: { value: string } }) => upsertPost(null, value)}
      onChange={({ target: { value } }: { target: { value: string } }) => setDate(value)}
    />
    <ContentViewModeSection top={20} bottom={15} row>
      <Section row>
        <SaveStatusText>{getSaveStatusText(saveStatus)}</SaveStatusText>
        {saveStatus === SaveStatus.FAILURE && <LinkLikeText onClick={() => upsertPost(title, date, content)}>{i18n.text('retry')}</LinkLikeText>}
      </Section>
      <ContentViewModeForm>
        <label>
          <Radio
            name='content-view-mode'
            value={ContentViewMode.EDITOR}
            checked={contentViewMode === ContentViewMode.EDITOR}
            onChange={() => setContentViewMode(ContentViewMode.EDITOR)}
          />
          {i18n.text('editor')}
        </label>
        <label>
          <PreviewRadio
            name='content-view-mode'
            value={ContentViewMode.PREVIEW}
            checked={contentViewMode === ContentViewMode.PREVIEW}
            onChange={() => setContentViewMode(ContentViewMode.PREVIEW)}
          />
          {i18n.text('preview')}
        </label>
      </ContentViewModeForm>
    </ContentViewModeSection>
    {contentViewMode === ContentViewMode.EDITOR ? (
      <Editor
        content={content}
        onBlur={({ target: { value } }) => upsertPost(null, null, value)}
        onChange={({ target: { value } }) => setContent(value)}
      />
    ) : (
      <Preview content={content} />
    )}
    {postId && <DeleteButton onClick={deletePost}>{i18n.text('delete')}</DeleteButton>}
    {isDeleted && <Redirect to='/' />}
  </Container>
};

export default Post;