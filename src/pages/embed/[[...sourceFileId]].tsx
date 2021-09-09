import { GetServerSideProps } from 'next';
import {
  getServerSideProps as _getServerSideProps,
  SourceFileIdPageProps,
} from '../[[...sourceFileId]]';

export const getServerSideProps: GetServerSideProps<
  SourceFileIdPageProps & { isEmbedded: true },
  { sourceFileId?: string[] }
> = async (ctx) => {
  const result = await _getServerSideProps(ctx);

  if ('props' in result) {
    return {
      ...result,
      props: {
        ...result.props,
        isEmbedded: true,
      },
    };
  }

  return result;
};

export { default } from '../[[...sourceFileId]]';
